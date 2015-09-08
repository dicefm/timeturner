import timeturner from '../';


import express from 'express';
import superTestAsPromised from 'supertest-as-promised';

describe('expressMiddleware', () => {
    let tt;
    let req;

    const uniqueUrl = `https://test.dice.fm/?${Math.random()}`;
    const uniqueUrl2 = `https://test.dice.fm/?${Math.random()}`;
    let createdItem;

    beforeEach(() => {
        tt = timeturner({autoStart: false});

        const {PORT} = process.env;

        const server = express();

        server.use('/schedule', tt.expressMiddleware());

        req = superTestAsPromised(server);
    });

    it('should GET /', asyncWithCallback(async () => {
        const res = await req.get('/schedule');

        expect(res.statusCode).to.eq(200);
        expect(res.body).to.be.an('array');
    }));

    describe(`when creating an item with a unique URL`, () => {
        const date = new Date();

        let id;

        let entry;

        before(asyncWithCallback(async () => {
            const date = new Date();
            const {body, statusCode} = await req.post('/schedule').send({
                method: 'GET',
                date  : date,
                url   : uniqueUrl,
            });

            expect(statusCode).to.eq(200);
            expect(body).to.be.an('object');

            expect(body._id).to.be.a('string');
            expect(body.headers).to.be.an('object');

            entry = body;
            id = body._id;
        }));

        it('should find it by /:id', asyncWithCallback(async () => {
            const date = new Date();
            const {body, statusCode} = await req.get(`/schedule/${id}`);

            expect(statusCode).to.eq(200);
            expect(body).to.be.an('object');
            expect(body).to.deep.eq(entry);
        }));

        it('should find it by /?url=:url', asyncWithCallback(async () => {
            const date = new Date();
            const {body, statusCode} = await req.get(`/schedule/?url=${entry.url}`);

            expect(statusCode).to.eq(200);
            expect(body).to.be.an('array');
            expect(body).to.deep.eq([entry]);
        }));

        describe('and trying to update it', () => {
            it('should be able to update it', asyncWithCallback(async () => {
                const date = new Date();
                const {body, statusCode} = await req.patch(`/schedule/${id}`, {name: uniqueUrl2});

                expect(statusCode).to.eq(200);

                entry.url = uniqueUrl2;

                expect(body).to.deep.eq(body);
            }));
        });

        describe('and trying to delete it', () => {
            it('should be deleted', asyncWithCallback(async () => {
                const date = new Date();
                const {body, statusCode} = await req.delete(`/schedule/${id}`);

                expect(statusCode).to.eq(204);
            }));

            it('and not found again', asyncWithCallback(async () => {
                const date = new Date();
                const {body, statusCode} = await req.get(`/schedule/${id}`);

                expect(statusCode).to.eq(404);
            }));
        })
    });

});
