import async from 'async';
import _ from 'lodash';
import {EventEmitter} from 'events';

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
            await processJob(job);
            events.emit('job:run:success', {job});
        } catch (_error) {
            debug('job failed', _error);
            error = _error;
            events.emit('job:run:fail', {job, error});
        }

        const state = (error ? 'FAIL' : 'SUCCESS');

        const newState = { state, error};
        try {
            events.emit('job:set-state:init', {job, ...newState});
            await apiClient.setState(_id, newState);
            events.emit('job:set-state:success', {job, ...newState});
        } catch (_error) {
            debug('setState failed', _error);

            events.emit('job:set-state:fail', {job, ...newState, error: _error});
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
