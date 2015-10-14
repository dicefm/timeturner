import performAndRespond from './perform-and-respond';


describe('performAndRespond', () => {
    let clock;
    let res;

    before(() => {
        clock = sinon.useFakeTimers();
    });

    after(() => {
        clock.restore();
    });

    beforeEach(() => {
        res = {};

        ['send', 'status', 'sendStatus'].forEach((key) => {
            res[key] = sinon.spy();
        });
    });

    function clockTick(ms) {
        clock.tick(ms);
        return new Promise((resolve) => {
            resolve();
        });
    }
    function waitFor(ms, opts = {}) {
        const {error, payload} = opts;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (error) {
                    reject(error)
                } else {
                    resolve(payload);
                }
            }, ms);
        });
    }

    it('should be a function', () => {
        expect(performAndRespond).to.be.a('function');
    });

    it('should await a promise', async () => {
        performAndRespond(waitFor(10), res);

        await clockTick(5);

        expect(res.send).not.have.been.called.once;
        expect(res.status).not.have.been.called.once;
        expect(res.sendStatus).not.have.been.called.once;

        await clockTick(6);

        expect(res.send).not.have.been.called.once;
        expect(res.status).not.have.been.called.once;
        expect(res.sendStatus).to.have.been.calledOnce;
        expect(res.sendStatus).calledWith(204);
    });

    it('should await a promise & return payload', async () => {
        performAndRespond(waitFor(10, {payload: {foo: 'bar'}}), res);

        await clockTick(5);

        expect(res.send).not.have.been.called.once;
        expect(res.status).not.have.been.called.once;
        expect(res.sendStatus).not.have.been.called.once;

        await clockTick(6);

        expect(res.status).not.have.been.called.once;
        expect(res.sendStatus).not.have.been.called.once;

        expect(res.send).calledWith({foo: 'bar'});
    });
});
