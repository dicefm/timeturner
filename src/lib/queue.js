import async from 'async';
import _ from 'lodash';
import {EventEmitter} from 'events';
import stringifySafe from 'json-stringify-safe';

const debug = require('debug')('dice:timeturner:queue');

export default function(opts) {
    opts = _.assign({
    }, opts);

    const {processJob, concurrency, apiClient, jobName} = opts;

    const events = new EventEmitter();

    async function worker(job, callback) {
        debug('working on job', job);
        let _id;
        let error = null;
        try {
            events.emit('job:run:init', {job});

            _id = job._id;

            await apiClient.setState(_id, {state: 'RUNNING', error: undefined});

            await processJob(job);
            events.emit('job:run:success', {job});
        } catch (_error) {
            debug('job failed', _error);
            error = _error;
            events.emit('job:run:fail', {job, error});
        }

        const state = (error ? 'FAIL' : 'SUCCESS');

        // remove circular references from error, and parse it back to an object.
        const newState = {state, error: JSON.parse(stringifySafe(error))};
        try {
            events.emit('job:set-state:init', {job, jobError: error, state});
            await apiClient.setState(_id, newState);
            events.emit('job:set-state:success', {job, jobError: error, state});
        } catch (_error) {
            debug('setState failed', _error);

            events.emit('job:set-state:fail', {job, jobError: error, state, error: _error});
        }

        callback(error);
    }

    // init queue
    const queue = async.queue(worker, concurrency);

    const {push} = queue;

    return {
        push,
        events,
    };
};
