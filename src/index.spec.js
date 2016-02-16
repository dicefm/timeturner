import timeturner from './index';

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
            });


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
    });
});
