import timeturner from '../index';

const debug = require('debug')('dice:timeturner:api:spec');

describe('api', async () => {
    let apiClient;
    let RequestModel;

    before(() => {
        const tt = timeturner({
            mongodb: {
                url: 'mongodb://localhost:27017/timeturner_api_tests',
            },
            autoStart: false,
        });
        apiClient = tt.apiClient;
        RequestModel = tt.RequestModel;
    });

    it('should setState', async () => {
        const request = await apiClient.create({
            url   : 'https://dice.fm/test',
            method: 'GET',
            date  : new Date(),
        });
        expect(request.state).to.eq('SCHEDULED');
        await apiClient.setRunning(request._id);
        await apiClient.setState(request._id, {state: 'FAIL'});
        const updated = await apiClient.readId(request._id);
        expect(updated.state).to.eq('FAIL');
    });

    it('should setState with Error', async () => {
        const request = await apiClient.create({
            url   : 'https://dice.fm/test',
            method: 'GET',
            date  : new Date(),
        });
        expect(request.state).to.eq('SCHEDULED');
        await apiClient.setRunning(request._id);
        await apiClient.setState(request._id, {state: 'FAIL', error: new Error('test')});
        const updated = await apiClient.readId(request._id);
        expect(updated.state).to.eq('FAIL');
        expect(updated.error).to.not.be.undefined;
    });
});
