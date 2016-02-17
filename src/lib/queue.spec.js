import queueModule from './queue';
import {EventEmitter} from 'events';

const ObjectId = require('mongoose').Types.ObjectId;


describe('queueModule', () => {
    const events = [
        'job:run:init',
        'job:run:success',
        'job:run:fail',
    ];

    function queueFactory(opts = {}) {
        let {apiClient} = opts;
        apiClient = apiClient || {
            setRunning         : sinon.spy(),
            setSuccess         : sinon.spy(),
            setFailedOrRetrying: sinon.spy(),
        };
        const concurrency = 5;
        let processJob = async function(job) {
            if (job.error) {
                throw new Error('Something went wrong!');
            }
        }

        processJob = sinon.spy(processJob);

        const queue = queueModule({processJob, concurrency, apiClient});

        return {queue, processJob, concurrency, apiClient};
    }

    it('should export `events`', () => {
        const {queue, processJob, concurrency, apiClient} = queueFactory();

        expect(queue).to.have.property('events');
        expect(queue.events).to.be.instanceof(EventEmitter);
    });

    it('should export `push`', () => {
        const {queue, processJob, concurrency, apiClient} = queueFactory();

        expect(queue).to.have.property('push');
        expect(queue.push).to.be.a('function');
    });

    describe('queing a valid job', () => {
        const _id = new ObjectId().toString();
        const job = {error: false, _id: _id, headers: {}};

        const spies = {};

        const {queue, processJob, concurrency, apiClient} = queueFactory();

        events.forEach((name) => {
            spies[name] = sinon.spy()
            queue.events.on(name, spies[name]);
        });


        it('should succeed', (done) => {
            queue.push(job, function(err) {
                expect(err).to.not.be.ok;

                expect(processJob).to.have.been.calledOnce;
                expect(processJob.args[0][0]).to.deep.eq(job);

                expect(apiClient.setRunning).to.have.been.calledWith(_id);
                expect(apiClient.setSuccess).to.have.been.calledWith(_id);

                done();
            });
        });

        it('and emit events', () => {
            expect(spies['job:run:init']).to.have.been.calledOnce;
            expect(spies['job:run:success']).to.have.been.calledOnce;
            expect(spies['job:run:fail']).to.have.been.notCalled;
        });
    });



    describe('queing a valid job w/ invalid apiClient', () => {
        const _id = new ObjectId().toString();
        const job = {error: false, _id: _id, headers: {}};

        const spies = {};

        const {queue, processJob, concurrency, apiClient} = queueFactory({
            apiClient: {
                setRunning: sinon.spy(() => {
                    throw new Error('setRunning failed!');
                }),
            }
        });

        events.forEach((name) => {
            spies[name] = sinon.spy()
            queue.events.on(name, spies[name]);
        });


        it('should fail', async (done) => {
            queue.push(job, function(err) {
                expect(err).to.be.ok;

                expect(processJob).to.have.been.notCalled;

                expect(apiClient.setRunning).to.have.been.calledOnce;
                expect(apiClient.setRunning).to.have.been.calledWith(_id);

                done();
            });
        });

        it('and emit events', () => {
            expect(spies['job:run:init']).to.have.been.calledOnce;
            expect(spies['job:run:success']).to.have.been.notCalled;
            expect(spies['job:run:fail']).to.have.been.notCalled;
        });
    });


    describe('queing an invalid job', () => {
        const _id = new ObjectId().toString();
        const job = {error: true, _id: _id, headers: {}};

        const spies = {};

        const {queue, processJob, concurrency, apiClient} = queueFactory();

        events.forEach((name) => {
            spies[name] = sinon.spy()
            queue.events.on(name, spies[name]);
        });

        it('should fail', (done) => {
            queue.push(job, function(err) {
                expect(processJob).to.have.been.calledOnce;
                expect(processJob.args[0][0]).to.deep.eq(job);

                expect(apiClient.setRunning).to.have.been.calledOnce;
                expect(apiClient.setFailedOrRetrying).to.have.been.calledOnce;
                expect(apiClient.setFailedOrRetrying).to.have.been.calledWith(_id, {error: new Error('Something went wrong!')});

                done();
            });
        });

        it('and emit events', () => {
            expect(spies['job:run:init']).to.have.been.calledOnce;
            expect(spies['job:run:success']).to.have.been.notCalled;
            expect(spies['job:run:fail']).to.have.been.calledOnce;
        });
    });
});
