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

    after(asyncWithCallback(async () => {
        await Request.removeAsync({})
        await db.closeAsync();
    }));

    class QueueMock {
        constructor() {
            for (const methodName of ['create', 'delay', 'save']) {
                this[methodName] = sinon.spy(this[methodName]);
            }
        }
        create() {
            return this;
        }

        delay() {
            return this;
        }

        save(done) {
            _.defer(done);
            return {
                id: 'job' + _.random(0, 1000000)
            };
        }

    }

    beforeEach(() => {
        apiClient = api({Request});

        queue = new QueueMock();

        checkSchedule = scheduleChecker({Request, apiClient, queue});
    });

    it('should be a function', () => {
        expect(scheduleChecker).to.be.a.function;
    });

    describe('when hecking schedule with nothing scheduled', () => {
        it('nothing should run', asyncWithCallback(async () => {
            await checkSchedule();

            expect(queue.create).not.have.been.called.once;
        }));
    });


    describe('when checking schedule that has a few scheduled jobs', () => {
        beforeEach(asyncWithCallback(async () => {
            await Promise.all([
                new Request({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'SCHEDULED'}).saveAsync(),
                new Request({url: 'https://test.dice.fm/', date: new Date(Date.now() + 1000), method: 'GET', state: 'SCHEDULED'}).saveAsync(),
                new Request({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'QUEING'}).saveAsync(),
                new Request({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'QUEUED'}).saveAsync(),
                new Request({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'SUCCESS'}).saveAsync(),
                new Request({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'ERROR'}).saveAsync(),
            ])
        }));

        it('the jobs should run', asyncWithCallback(async () => {
            await checkSchedule();

            expect(queue.create).have.been.called.twice;
        }));
    });
});
