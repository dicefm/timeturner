import queueModule from './queue';
import {EventEmitter} from 'events';

const ObjectId = require('mongoose').Types.ObjectId;


describe('queueModule', () => {
    const events = [
        'job:init',
        'job:success',
        'job:fail',
        'job:set-state:init',
        'job:set-state:success',
        'job:set-state:fail',
    ];

    function queueFactory(opts = {}) {
        let {apiClient} = opts;
        apiClient = apiClient || {
            setState: sinon.spy(),
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

                expect(apiClient.setState).to.have.been.calledOnce;
                expect(apiClient.setState).to.have.been.calledWith(_id, {state: 'SUCCESS', error: null});

                done();
            });
        });

        it('and emit events', () => {
            expect(spies['job:init']).to.have.been.calledOnce;
            expect(spies['job:success']).to.have.been.calledOnce;
            expect(spies['job:fail']).not.have.been.called.once;

            expect(spies['job:set-state:init']).to.have.been.calledOnce;
            expect(spies['job:set-state:success']).to.have.been.calledOnce;
            expect(spies['job:set-state:fail']).not.have.been.called.once;
        });
    });



    describe('queing a valid job w/ invalid apiClient', () => {
        const _id = new ObjectId().toString();
        const job = {error: false, _id: _id, headers: {}};

        const spies = {};

        const {queue, processJob, concurrency, apiClient} = queueFactory({
            apiClient: {
                setState: sinon.spy(() => {
                    throw new Error('Saving failed!');
                }),
            }
        });

        events.forEach((name) => {
            spies[name] = sinon.spy()
            queue.events.on(name, spies[name]);
        });


        it('should succeed', (done) => {
            queue.push(job, function(err) {
                expect(err).to.not.be.ok;

                expect(processJob).to.have.been.calledOnce;
                expect(processJob.args[0][0]).to.deep.eq(job);

                expect(apiClient.setState).to.have.been.calledOnce;
                expect(apiClient.setState).to.have.been.calledWith(_id, {state: 'SUCCESS', error: null});

                done();
            });
        });

        it('and emit events', () => {
            expect(spies['job:init']).to.have.been.calledOnce;
            expect(spies['job:success']).to.have.been.calledOnce;
            expect(spies['job:fail']).not.have.been.called.once;

            expect(spies['job:set-state:init']).to.have.been.calledOnce;
            expect(spies['job:set-state:success']).not.have.been.called.once;
            expect(spies['job:set-state:fail']).to.have.been.calledOnce;
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
                expect(err).to.be.ok;

                expect(processJob).to.have.been.calledOnce;
                expect(processJob.args[0][0]).to.deep.eq(job);

                expect(apiClient.setState).to.have.been.calledOnce;
                expect(apiClient.setState).to.have.been.calledWith(_id, {state: 'FAIL', error: new Error('Something went wrong!')});

                done();
            });
        });

        it('and emit events', () => {
            expect(spies['job:init']).to.have.been.calledOnce;
            expect(spies['job:success']).not.have.been.called.once;
            expect(spies['job:fail']).to.have.been.calledOnce;

            expect(spies['job:set-state:init']).to.have.been.calledOnce;
            expect(spies['job:set-state:success']).to.have.been.calledOnce;
            expect(spies['job:set-state:fail']).not.have.been.called.once;
        });
    });
});
