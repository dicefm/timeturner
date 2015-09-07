import timeturner from '../';


import express from 'express';
import superTestAsPromised from 'supertest-as-promised';

describe('expressMiddleware', () => {
    let tt;
    let req;

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
});
