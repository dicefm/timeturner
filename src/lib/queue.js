import async from 'async';
import _ from 'lodash';
import {EventEmitter} from 'events';

const debug = require('debug')('dice:timeturner:queue');

export default function(opts) {
    opts = _.assign({
    }, opts);

    const {processJob, concurrency, apiClient, jobName} = opts;

    const events = new EventEmitter();

    async function worker(job) {
        debug('working on job', job);

        const {_id} = job;

        events.emit('job:run:init', {job});

        await apiClient.setRunning(_id);

        let error;
        try {
            await processJob(job);
        } catch (_err) {
            error = _err;
        }

        if (error) {
            await apiClient.setFailedOrRetrying(_id, {error});
            events.emit('job:run:fail', {job});
        } else {
            await apiClient.setSuccess(_id);
            events.emit('job:run:success', {job});
        }
    }

    async function workerWrapper(job, callback) {
        let error;
        try {
            await worker(job);
        } catch (_error) {
            error = _error;
        }

        callback(error);
    }

    // init queue
    const queue = async.queue(workerWrapper, concurrency);

    const {push} = queue;

    return {
        push,
        events,
    };
};
