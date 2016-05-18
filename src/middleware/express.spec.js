import Promise from 'bluebird';
import express from 'express';
import superTestAsPromised from 'supertest-as-promised';

import timeturner from '../';

describe('expressMiddleware', () => {
    let tt;
    let req;

    const uniqueUrl = `https://test.dice.fm/?before${Math.random()}`;
    const uniqueUrl2 = `https://test.dice.fm/?after${Math.random()}`;
    const uniqueUrlRunning = `https://test.dice.fm/?running${Math.random()}`;
    const notes = {foo: 'bar'};
    let createdItem;

    beforeEach(() => {
        tt = timeturner({autoStart: false});

        const {PORT} = process.env;

        const server = express();

        server.use('/schedule', tt.expressMiddleware());

        req = superTestAsPromised(server);
    });

    it('should GET /', async () => {
        const res = await req.get('/schedule');

        expect(res.statusCode).to.eq(200);
        expect(res.body).to.be.an('array');
    });

    describe('when creating an item with a unique URL', () => {
        const date = new Date();

        let id, runningId;

        let entry;

        before(async () => {
            const date = new Date();
            const {body, statusCode} = await req.post('/schedule').send({
                method: 'GET',
                date  : date,
                url   : uniqueUrl,
                notes : notes,
            });
            const {body: runningBody} = await req.post('/schedule').send({
                method: 'GET',
                date  : date,
                url   : uniqueUrlRunning,
                notes : notes,
                state : 'RUNNING',
            });

            expect(statusCode).to.eq(200);
            expect(body).to.be.an('object');

            expect(body._id).to.be.a('string');
            expect(body.headers).to.be.an('object');
            expect(body).to.have.property('error');
            expect(body.error).to.eq(null);

            entry = body;
            id = body._id;
            runningId = runningBody._id;
        });

        it('should find it by /:id', async () => {
            const date = new Date();
            const {body, statusCode} = await req.get(`/schedule/${id}`);

            expect(statusCode).to.eq(200);
            expect(body).to.be.an('object');
            expect(body).to.deep.eq(entry);
        });

        it('should find it by /?url=:url', async () => {
            const date = new Date();
            const {body, statusCode} = await req.get(`/schedule/?url=${entry.url}`);

            expect(statusCode).to.eq(200);
            expect(body).to.be.an('array');
            expect(body).to.deep.eq([entry]);
        });

        describe('and trying to update it', () => {
            let patchRes;
            before(async () => {
                patchRes = await req.patch(`/schedule/${id}`).send({url: uniqueUrl2});
            });

            it('should get expected response when updating it', async () => {
                const {body, statusCode} = patchRes;

                expect(body.url).to.eq(uniqueUrl2);
            });

            it('should get expected response when fetching the event afterwards', async () => {
                const {body, statusCode} = await req.get(`/schedule/${id}`);

                expect(body.url).to.eq(uniqueUrl2);
            });

            it('should not have changed other properties', async () => {
                const {body, statusCode} = await req.get(`/schedule/${id}`);

                expect(body.notes).to.deep.eq(notes);
            });

            it('should not updated jobs in intermediate states expected response when updating it', async () => {
                const {body, statusCode} = await req.patch(`/schedule/${runningId}`).send({data: new Date(), state: 'SCHEDULED'});
                expect(statusCode).to.eq(403);
                expect(body.description).to.eq('You can\'t change requests that are in a "RUNNING" state');
            });

        });

        describe('and trying to delete it', () => {
            it('should be deleted', async () => {
                const date = new Date();
                const {body, statusCode} = await req.delete(`/schedule/${id}`);

                expect(statusCode).to.eq(204);
            });

            it('and not found again', async () => {
                const date = new Date();
                const {body, statusCode} = await req.get(`/schedule/${id}`);

                expect(statusCode).to.eq(404);
            });
        })
    });

});
