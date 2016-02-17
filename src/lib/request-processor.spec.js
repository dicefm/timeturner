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
        const job = {
            url    : 'https://api-test.dice.fm/200',
            method : 'GET',
            headers: {},
        };

        const {statusCode, body} = await processJob(job);

        expect(statusCode).to.eq(200);
        expect(body).to.eq('foo bar');
    });

    it('should perform JSON requests', async () => {
        const job = {
            url    : 'https://api-test.dice.fm/json/200',
            method : 'GET',
            headers: {
                'content-type': 'application/json',
            },
        };

        const {statusCode, body} = await processJob(job);

        expect(statusCode).to.eq(200);
        expect(body).to.deep.eq({
            foo: 'bar',
        });

    });

    describe('when POSTing JSON', () => {
        let targetCalledSpy;

        beforeEach(() => {
            targetCalledSpy = sinon.spy();

            nock('https://api-test.dice.fm')
                .post('/post')
                .reply(200, (uri, requestBody) => {
                    targetCalledSpy(requestBody);

                    return {foo: 'bar'};
                });

        });

        it('should work with post body as JSON', async () => {
            const job = {
                url    : 'https://api-test.dice.fm/post',
                method : 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: {hey: 'object'}
            };

            const {statusCode, body} = await processJob(job);

            expect(statusCode).to.eq(200);
            expect(body).to.deep.eq({
                foo: 'bar',
            });

            expect(targetCalledSpy).to.have.been.calledOnce;
            expect(targetCalledSpy).to.have.been.calledWith({hey: 'object'});
        });
    })

    it('should throw errors', async () => {
        const job = {
            url    : 'https://api-test.dice.fm/json/418',
            method : 'GET',
            headers: {
                'content-type': 'application/json',
            },
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
