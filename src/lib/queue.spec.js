import queueModule from './queue';

const ObjectId = require('mongoose').Types.ObjectId;


describe('queueModule', () => {
    let _queue;

    function deferred(fn) {
        return function() {
            setTimeout(fn, 10);
        };
    }

    function queueFactory() {
        const apiClient = {
            setState: sinon.spy(),
        };
        const concurrency = 5;
        let processRequest = async function(job) {
            if (job.error) {
                throw new Error('Something went wrong!');
            }
        }

        processRequest = sinon.spy(processRequest);

        const queue = queueModule({processRequest, concurrency, apiClient});

        return {queue, processRequest, concurrency, apiClient};
    }

    it('should run jobs successfully', (done) => {
        const {queue, processRequest, concurrency, apiClient} = queueFactory();
        _queue = queue;

        const _id = new ObjectId().toString();
        const job = {error: false, _id: _id, headers: {}};
        queue.push(job, function(err) {
            expect(err).to.not.be.ok;

            expect(processRequest).to.have.been.calledOnce;
            expect(processRequest.args[0][0]).to.deep.eq(job);

            expect(apiClient.setState).to.have.been.calledOnce;
            expect(apiClient.setState).to.have.been.calledWith(_id, {state: 'SUCCESS', error: null});

            done();
        });
    });

    it('should fail jobs sometimes too', (done) => {
        const {queue, processRequest, concurrency, apiClient} = queueFactory();
        _queue = queue;

        const _id = new ObjectId().toString();
        const job = {error: true, _id: _id, headers: {}};

        queue.push(job, function(err) {
            expect(err).to.be.ok;

            expect(processRequest).to.have.been.calledOnce;
            expect(processRequest.args[0][0]).to.deep.eq(job);

            expect(apiClient.setState).to.have.been.calledOnce;
            expect(apiClient.setState).to.have.been.calledWith(_id, {state: 'FAIL', error: new Error('Something went wrong!')});

            done();
        });
    });
});
