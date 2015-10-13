import async from 'async';
import _ from 'lodash';
import Promise from 'bluebird';

const debug = require('debug')('dice:timeturner:queue');

export default function(opts) {
    opts = _.assign({
    }, opts);

    const {processRequest, concurrency, apiClient, jobName} = opts;

    async function worker(job, callback) {
        debug('working on job', job);
        let _id;
        let error = null;
        try {
            _id = job._id;
            await processRequest(job);
        } catch (_error) {
            debug('job failed', _error);
            error = _error;
        }

        const state = (error ? 'FAIL' : 'SUCCESS');

        try {
            await apiClient.setState(_id, {state, error});
        } catch (_error) {
            debug('setState failed', _error);

            error = _error;
        }

        callback(error);
    }

    // init queue
    const queue = async.queue(worker, concurrency);


    return queue;
};
