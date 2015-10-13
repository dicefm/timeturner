const mongoose = Promise.promisifyAll(require('mongoose'));

import scheduleChecker from './schedule-checker';
import api from './api';
import queueModule from './queue';

import RequestSchema from '../schemas/Request';


describe('scheduleChecker', () => {
    let db;
    let RequestModel;
    let apiClient;
    let enqueue;

    let checkSchedule;
    let queueCreateSpy;

    before(() => {
        db = mongoose.createConnection('mongodb://localhost:27017/timeturner_schedule_checker_tests');

        RequestModel = db.model('Request', RequestSchema);
    });

    before(async () => {
        await RequestModel.removeAsync({})
    });

    after(async () => {
        await RequestModel.removeAsync({})
        await db.closeAsync();
    });

    beforeEach(() => {
        apiClient = api({RequestModel});

        enqueue = sinon.spy(() => {});

        checkSchedule = scheduleChecker({RequestModel, apiClient, enqueue});
    });

    it('should be a function', () => {
        expect(scheduleChecker).to.be.a.function;
    });

    describe('when hecking schedule with nothing scheduled', () => {
        it('nothing should run', async () => {
            await checkSchedule();

            expect(enqueue).not.have.been.called.once;
        });
    });


    describe('when checking schedule that has a few scheduled jobs', () => {
        beforeEach(async () => {
            await Promise.all([
                new RequestModel({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'SCHEDULED'}).saveAsync(),
                new RequestModel({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'SCHEDULED'}).saveAsync(),
                new RequestModel({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'QUEING'}).saveAsync(),
                new RequestModel({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'QUEUED'}).saveAsync(),
                new RequestModel({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'SUCCESS'}).saveAsync(),
                new RequestModel({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'ERROR'}).saveAsync(),
            ])
        });

        it('the jobs should run', async () => {
            await checkSchedule();

            expect(enqueue).have.been.called.twice;
        });
    });



    describe('when a job\'s state gets changed externally while running', () => {
        beforeEach(async () => {
            await Promise.all([
                new RequestModel({url: 'https://test.dice.fm/', date: new Date(), method: 'GET', state: 'SCHEDULED'}).saveAsync(),
            ])
        });

        it('should not run that job', async () => {
            // Make sure we change the job right after `read`
            const read = apiClient.read.bind(apiClient)
            apiClient.read = async function (...args) {
                const res = await read.apply(this, args);

                const query = args[0];

                expect(res.length).to.be.above(0)

                // mock another instance snatching the job straight after this one picked it up
                const raw = await RequestModel.updateAsync(query, {$set: {state: 'QUEUING'}});

                return res;
            }
            await checkSchedule();

            expect(enqueue).not.have.been.called.once;
        });
    });
});
