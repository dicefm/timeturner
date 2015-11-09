import timeturner from '../index';

const debug = require('debug')('dice:timeturner:api:spec');

describe('api', async () => {
    let tt;
    before(() => {
        tt = timeturner({
            mongodb: {
                url: 'mongodb://localhost:27017/timeturner_index_tests',
            },
        });
    });

    after(() => {
        tt.loop.stop();
    });

    it('should setState', async () => {
        const {RequestModel} = tt;
        const request = await tt.apiClient.create({
            url   : 'https://dice.fm/test',
            method: 'GET',
            date  : new Date(),
        });
        expect(request.state).to.eq('SCHEDULED');
        await tt.apiClient.setState(request._id, {state: 'FAIL'});
        const updated = await tt.apiClient.readId(request._id);
        expect(updated.state).to.eq('FAIL');
    });
});
