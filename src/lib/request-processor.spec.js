import nock from 'nock';
import requestProcessor from './request-processor';

describe('requestProcessor', () => {
    const processRequest = requestProcessor();

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


    it('should perform requests', (done) => {
        const data = {
            url    : 'https://api-test.dice.fm/200',
            method : 'GET',
            headers: {},
        };
        const job = {
            data: data
        };
        processRequest(job, function(err, response) {
            expect(err).to.not.be.ok;

            expect(response.statusCode).to.eq(200);
            expect(response.body).to.eq('foo bar');

            done();
        })
        .catch(done);
    });

    it('should perform JSON requests', (done) => {
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
        processRequest(job, function(err, response) {
            expect(err).to.not.be.ok;

            expect(response.statusCode).to.eq(200);
            expect(response.body).to.deep.eq({
                foo: 'bar',
            });

            done();
        })
        .catch(done);
    });

    it('should handle errors', (done) => {
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
        processRequest(job, function(err, response) {
            expect(err).to.be.ok;
            expect(err.name).to.eq('StatusCodeError');
            expect(err.statusCode).to.eq(418);

            done();
        })
        .catch(done);
    });
});
