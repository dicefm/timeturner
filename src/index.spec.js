import timeturner from './index';

import nock from 'nock';
import superTestAsPromised from 'supertest-as-promised';

import express from 'express';
import bodyParser from 'body-parser';

function waitFor(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('timeturner', () => {
    describe('should expose', () => {
        let tt;
        before(() => {
            nock.cleanAll();
            tt = timeturner({
                mongodb: {
                    url: 'mongodb://localhost:27017/timeturner_index_tests',
                },
            });
        });

        after(() => {
            tt.loop.stop();
        });

        it('an object', () => {
            expect(tt).to.be.an('object');
        });

        it('loop', () => {
            const {loop} = tt;

            expect(loop).to.be.an('object');
            expect(loop.start).to.be.a('function');
            expect(loop.stop).to.be.a('function');
        });

        it('queue', () => {
            const {queue} = tt;

            expect(queue).to.be.an('object');
            expect(queue.push).to.be.a('function');
        });

        it('RequestModel', () => {
            const {RequestModel} = tt;

            expect(RequestModel).to.be.a('function');
        });

        it('RequestSchema', () => {
            const {RequestSchema} = tt;

            expect(RequestSchema).to.be.an('object');
        });

        it('expressMiddleware', () => {
            const {expressMiddleware} = tt;

            expect(expressMiddleware).to.be.a('function');
        });
    });

    describe('integration test', () => {
        let tt;
        let req;
        let server;

        before(async () => {
            server = express();
            server.use(bodyParser.json());

            tt = timeturner({
                mongodb: {
                    url: 'mongodb://localhost:27017/timeturner_integration_tests',
                },
                interval: 10,
            });

            await tt.RequestModel.remove();


            server.use('/schedule', tt.expressMiddleware());

            req = superTestAsPromised(server);
        });

        after(() => {
            tt.loop.stop();
        });

        it('GET `/schedule` should work', async () => {
            const res = await req.get('/schedule');

            expect(res.statusCode).to.eq(200);
            expect(res.body).to.be.an('array');

            expect(res.body.length).to.eq(0);
        });

        describe('creating request', () => {
            const TARGET_ORIGIN = 'https://api-test.dice.fm';
            const TARGET_PATHNAME = `/${Math.random()}`;
            const TARGET_HREF = TARGET_ORIGIN + TARGET_PATHNAME;

            let targetCalledSpy;

            let jobRunInit;
            let jobRunSuccess;
            let jobRunFail;

            before(() => {
                targetCalledSpy = sinon.spy();

                jobRunInit = sinon.spy();
                jobRunSuccess = sinon.spy();
                jobRunFail = sinon.spy();


                tt.queue.events.on('job:run:init', jobRunInit);
                tt.queue.events.on('job:run:success', jobRunSuccess);
                tt.queue.events.on('job:run:fail', jobRunFail);

                nock(TARGET_ORIGIN)
                    .get(TARGET_PATHNAME)
                    .reply(200, targetCalledSpy);
            });

            it('should create the request', async () => {
                const soon = new Date();
                soon.setMilliseconds(soon.getMilliseconds() + 2);

                const reqBody = {
                    url   : TARGET_HREF,
                    date  : soon,
                    method: 'GET',
                };
                const {body, statusCode} = await req.post('/schedule').send(reqBody);
                expect(statusCode).to.eq(200);

                expect(body._id).to.be.truthy;
                expect(targetCalledSpy).to.have.been.notCalled;
            });

            it('should find the request in `/`', async () => {
                const res = await req.get('/schedule');

                expect(res.statusCode).to.eq(200);
                expect(res.body).to.be.an('array');

                expect(res.body.length).to.eq(1);

                const [item] = res.body;

                expect(item.url).to.eq(TARGET_HREF);
            });

            it('should trigger the request eventually', async () => {
                do {
                    await waitFor(10);
                } while (targetCalledSpy.notCalled);

                expect(targetCalledSpy).to.have.been.calledOnce;
            });

            it('should have succeeded', async () => {
                const res = await req.get('/schedule');

                expect(res.statusCode).to.eq(200);
                expect(res.body).to.be.an('array');

                expect(res.body.length).to.eq(1);

                const [item] = res.body;

                expect(item.state).to.eq('SUCCESS');
            });

            it('should have emitted events', async () => {
                expect(jobRunInit).to.have.been.calledOnce;
                expect(jobRunSuccess).to.have.been.calledOnce;
                expect(jobRunFail).to.have.been.notCalled;

                let job;

                job = jobRunInit.args[0][0].job;

                expect(job).to.be.an.object;
                expect(job.url).to.eq(TARGET_HREF);
                expect(job.state).to.eq('SCHEDULED');
                expect(job.attempts_count).to.eq(0);
                expect(job.attempts_max).to.eq(1);

                job = jobRunSuccess.args[0][0].job;

                expect(job).to.be.an.object;
                expect(job.url).to.eq(TARGET_HREF);
                expect(job.state).to.eq('SUCCESS');
                expect(job.attempts_count).to.eq(1);
                expect(job.attempts_max).to.eq(1);
            });
        });

        describe('retrying failing request', () => {
            const TARGET_URL = 'https://api-fail.dice.fm';

            it('should retry the request and eventually work', async function() {
                this.timeout(10 * 1000);

                let targetCalledSpy = sinon.spy();

                nock(TARGET_URL).get('/').times(9).reply(500);
                nock(TARGET_URL).get('/').once().reply(200, targetCalledSpy);

                const soon = new Date();
                soon.setMilliseconds(soon.getMilliseconds() + 10);

                const reqBody = {
                    url   : TARGET_URL,
                    date  : soon,
                    method: 'GET',

                    attempts_max: 10,
                };
                const {body, statusCode} = await req.post('/schedule').send(reqBody);
                expect(statusCode).to.eq(200);

                const {_id} = body;

                expect(_id).to.be.truthy;

                const allStates = new Set();

                let state;

                do {
                    const {body} = await req.get(`/schedule/${_id}`);

                    state = body.state;

                    allStates.add(state);

                    await waitFor(10);
                } while (state !== 'SUCCESS');

                expect(allStates.has('RETRYING')).to.be.truthy;
                expect(allStates.has('SUCCESS')).to.be.truthy;

                expect(targetCalledSpy).to.have.been.calledOnce;
            });

            it('should set to state to failed if it never works', async function() {
                this.timeout(10 * 1000);

                let targetCalledSpy = sinon.spy();

                nock(TARGET_URL).get('/').times(10).reply(500);

                const soon = new Date();
                soon.setMilliseconds(soon.getMilliseconds() + 10);

                const reqBody = {
                    url   : TARGET_URL,
                    date  : soon,
                    method: 'GET',

                    attempts_max: 10,
                };
                const {body, statusCode} = await req.post('/schedule').send(reqBody);
                expect(statusCode).to.eq(200);

                const {_id} = body;

                expect(_id).to.be.truthy;

                const allStates = new Set();

                let state;

                do {
                    const {body} = await req.get(`/schedule/${_id}`);

                    state = body.state;

                    allStates.add(state);

                    await waitFor(10);
                } while (state !== 'FAILED');

                expect(allStates.has('RETRYING')).to.be.truthy;
                expect(allStates.has('FAILED')).to.be.truthy;
            });
        });
    });
});
