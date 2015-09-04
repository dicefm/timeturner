import Promise from 'bluebird';

const mongoose = Promise.promisifyAll(require('mongoose'));

import scheduleChecker from './schedule-checker';
import api from './api';
import queueModule from './queue';

import RequestSchema from '../schemas/Request';


describe('scheduleChecker', () => {
    let db;
    let Request;
    let apiClient;
    let queue;

    let checkSchedule;
    let queueCreateSpy;

    before(() => {
        db = mongoose.createConnection('mongodb://localhost:27017/timeturner_schedule_checker_tests');

        Request = db.model('Request', RequestSchema);
    });

    after((done) => {
        Request.remove({}, function() {
            db.close();
            done();
        });
    });

    beforeEach(() => {
        apiClient = api({Request});

        queueCreateSpy = sinon.spy();
        queue = {create: queueCreateSpy};


        checkSchedule = scheduleChecker({Request, apiClient, queue});
    });

    it('should be a function', () => {
        expect(scheduleChecker).to.be.a.function;
    });

    describe('checking schedule with nothing scheduled', () => {
        it('nothing should run', async (done) => {
            try {
                await checkSchedule();

                expect(queueCreateSpy).not.have.been.called.once;

                done();
            } catch (err) {
                done(err);
            }
        });
    });
});
