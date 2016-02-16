import timeturner from './index';

import nock from 'nock';
import superTestAsPromised from 'supertest-as-promised';

import express from 'express';
import bodyParser from 'body-parser';

describe('timeturner', () => {
    describe('should expose', () => {
        let tt;
        before(() => {
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

            // 404 handler
            server.use((req, res, next) => {
                const err = new Error('Not found');
                err.statusCode = 404;

                next(err);
            });

            // error handler
            server.use((err, req, res, next) => {
                const displayError = {
                    description: err.message || 'Something went wrong',
                };

                res.status(displayError.status);
                res.send(displayError);
            });

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
            const TARGET_URL = 'https://api-test.dice.fm';

            let targetCalledSpy;

            before(() => {
                targetCalledSpy = sinon.spy();

                nock('https://api-test.dice.fm')
                    .get('/')
                    .reply(200, targetCalledSpy);
            });

            it('should create the request in 2ms', async () => {
                const soon = new Date();
                soon.setMilliseconds(soon.getMilliseconds() + 2);

                const reqBody = {
                    url   : TARGET_URL,
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
            });

            it('should trigger the request after a while', (next) => {
                function checkCalled() {
                    if (targetCalledSpy.notCalled) {
                        setTimeout(checkCalled, 10);
                    } else {
                        expect(targetCalledSpy).to.have.been.calledOnce;

                        next();
                    }
                }

                checkCalled();
            });
        });
    });
});
