import Promise from 'bluebird';
import performAndRespond from './perform-and-respond';


describe('performAndRespond', () => {
    let resolve;
    let reject;
    let res;

    function clockTick(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    beforeEach(() => {
        res = {};

        ['send', 'status', 'sendStatus'].forEach((key) => {
            res[key] = sinon.spy();
        });

        const promise = new Promise((_resolve, _reject) => {
            resolve = _resolve;
            reject = _reject;
        });

        performAndRespond(promise, res);
    });

    it('should be a function', () => {
        expect(performAndRespond).to.be.a('function');
    });

    it('should await a promise', async () => {
        expect(res.send).to.have.been.notCalled;
        expect(res.status).to.have.been.notCalled;
        expect(res.sendStatus).to.have.been.notCalled;

        resolve();
        await clockTick(0);

        expect(res.send).to.have.been.notCalled;
        expect(res.status).to.have.been.notCalled;
        expect(res.sendStatus).to.have.been.calledOnce;
        expect(res.sendStatus).calledWith(204);
    });

    it('should await a promise & return payload', async () => {
        expect(res.send).to.have.been.notCalled;
        expect(res.status).to.have.been.notCalled;
        expect(res.sendStatus).to.have.been.notCalled;

        resolve({foo: 'bar'});
        await clockTick(0);

        expect(res.status).to.have.been.notCalled;
        expect(res.sendStatus).to.have.been.notCalled;

        expect(res.send).calledWith({foo: 'bar'});
    });


    it('should await a promise & return errors', async () => {
        expect(res.send).to.have.been.notCalled;
        expect(res.status).to.have.been.notCalled;
        expect(res.sendStatus).to.have.been.notCalled;

        reject(new Error('msg'));
        await clockTick(0);

        expect(res.sendStatus).to.have.been.notCalled;

        expect(res.status).to.have.been.called.once;
        expect(res.send).to.have.been.called.once;

        expect(res.send).calledWith({description: 'msg'});
    });
});
