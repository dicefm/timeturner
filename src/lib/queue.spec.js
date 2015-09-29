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
        const kue = {
            prefix: 'q' + Math.random(),
        };
        const apiClient = {
            setState: sinon.spy(),
        };
        const concurrency = 5;
        let processRequest = function(job, done) {
            let err;
            if (job.data.error) {
                err = new Error('Something went wrong!');
            }
            done(err);
        }

        processRequest = sinon.spy(processRequest);

        const queue = queueModule({kue, processRequest, concurrency, apiClient});

        return {queue, kue, processRequest, concurrency, apiClient};
    }

    it('should run jobs successfully', (done) => {
        const {queue, kue, processRequest, concurrency, apiClient} = queueFactory();
        _queue = queue;

        const _id = new ObjectId().toString();
        const data = {error: false, _id: _id, headers: {}};
        const job = queue
            .create('request', data)
            .save((err) => {
                if (err) {
                    done(err);
                }
            })
            ;

        queue.on('job complete', deferred(() => {
            expect(processRequest).to.have.been.calledOnce;
            expect(processRequest.args[0][0].id).to.eq(''+job.id);
            expect(processRequest.args[0][0].data).to.deep.eq(data);

            expect(apiClient.setState).to.have.been.calledOnce;
            expect(apiClient.setState).to.have.been.calledWith(_id, 'SUCCESS');

            done();
        }));
        job.on('failed', done);
        queue.on('error', done)
    });

    it('should fail jobs sometimes too', (done) => {
        const {queue, kue, processRequest, concurrency, apiClient} = queueFactory();
        _queue = queue;

        const _id = '' + Math.random();
        const data = {error: true, _id: _id, headers: {}};
        const job = queue
            .create('request', data)
            .save((err) => {
                if (err) {
                    done(err);
                }
            })
            ;

        queue.on('job complete', () => {
            done(new Error('Shouldn\'t have succeeded!'));
        });
        queue.on('job failed', deferred(() => {
            expect(processRequest).to.have.been.calledOnce;
            expect(processRequest.args[0][0].id).to.eq(''+job.id);
            expect(processRequest.args[0][0].data).to.deep.eq(data);

            expect(apiClient.setState).to.have.been.calledOnce;
            expect(apiClient.setState).to.have.been.calledWith(_id, 'FAIL');

            done();
        }));
        queue.on('error', done);
    });

    afterEach((done) => {
        _queue.shutdown(done);
    });
});
