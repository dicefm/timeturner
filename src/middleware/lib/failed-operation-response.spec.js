import failedOperationResponse from './failed-operation-response';


describe('failedOperationResponse', () => {
    let clock;
    let res;

    beforeEach(() => {
        res = {};

        ['send', 'status', 'sendStatus'].forEach((key) => {
            res[key] = sinon.spy();
        });
    });

    it('should be a function', () => {
        expect(failedOperationResponse).to.be.a('function');
    });

    it('should default statusCode to 400', () => {
        const error = new Error();

        const {statusCode, payload} = failedOperationResponse(error);

        expect(statusCode).to.eq(400);
    });

    it('should get message from error', () => {
        const error = new Error('hey');

        const {statusCode, payload} = failedOperationResponse(error);

        expect(payload).to.deep.eq({description: 'hey'});
    });

    it('should have overridable statusCode', () => {
        const error = new Error();
        error.statusCode = 418;

        const {statusCode, payload} = failedOperationResponse(error);

        expect(statusCode).to.eq(418);
    });

    it('should extract errors from `errors`', () => {
        const error = new Error('Validation error');
        error.errors = {
            name: new Error('Invalid `name`'),
        };

        const {statusCode, payload} = failedOperationResponse(error);

        expect(payload).to.deep.eq({
            description: 'Validation error',
            errors     : {
                name: 'Invalid `name`',
            },
        });
    });
});
