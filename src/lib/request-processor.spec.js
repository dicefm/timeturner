import nock from 'nock';
import requestProcessor from './request-processor';

describe('requestProcessor', () => {
    const processJob = requestProcessor();

    beforeEach(() => {
        nock('https://api-test.dice.fm')
            .matchHeader('content-type', 'application/json')
            .get('/json/200')
            .reply(200, {
                foo: 'bar',
            });

        nock('https://api-test.dice.fm')
            .get('/200')
            .reply(200, 'foo bar');

        nock('https://api-test.dice.fm')
            .matchHeader('content-type', 'application/json')
            .get('/json/418')
            .reply(418, {
                foo: 'bar',
            });
    });


    it('should perform requests', async () => {
        const data = {
            url    : 'https://api-test.dice.fm/200',
            method : 'GET',
            headers: {},
        };
        const job = {
            data: data
        };

        const {statusCode, body} = await processJob(job);

        expect(statusCode).to.eq(200);
        expect(body).to.eq('foo bar');
    });

    it('should perform JSON requests', async () => {
        const data = {
            url    : 'https://api-test.dice.fm/json/200',
            method : 'GET',
            headers: {
                'content-type': 'application/json',
            },
        };
        const job = {
            data: data
        };

        const {statusCode, body} = await processJob(job);

        expect(statusCode).to.eq(200);
        expect(body).to.deep.eq({
            foo: 'bar',
        });

    });

    it('should throw errors', async () => {
        const data = {
            url    : 'https://api-test.dice.fm/json/418',
            method : 'GET',
            headers: {
                'content-type': 'application/json',
            },
        };
        const job = {
            data: data
        };
        try {
            await processJob(job);
        } catch (err) {
            expect(err).to.be.ok;
            expect(err.name).to.eq('StatusCodeError');
            expect(err.statusCode).to.eq(418);
        }
    });
});
