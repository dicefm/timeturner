import _ from 'lodash';
import moment from 'moment';

const debug = require('debug')('dice:timeturner:schedule-checker');

export default function(opts) {
    opts = _.assign({
        RequestModel: null,
        apiClient   : null,
        interval    : 500,
        enqueue     : null,
    }, opts);

    const {RequestModel, apiClient, interval, enqueue} = opts;

    /**
     * Makes sure that request is an atomic operation by updating into a QUEUED state
     *
     * @param  {RequestModel} request
     * @return {bool}
     */
    async function assureAtomic(request) {
        const raw = await RequestModel.updateAsync({
            _id  : request._id,
            state: 'SCHEDULED',
        }, {
            $set: {
                state: 'QUEING',
            }
        });

        const nModified = raw.nModified || raw.n; // support multiple mongo versions
        if (nModified !== 1) {
            return false;
        }

        return true;
    }

    function waitFor(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }

    async function createJob(request) {
        let delay = moment(request.date).diff(moment());
        debug(`Scheduling ${request.method} to ${request.url} in ${delay} ms`);

        if (delay < 0) {
            debug(`Whoops. Seems like this has been delayed ${Math.abs(delay)} milliseconds.`);
            delay = 0;
        }

        await waitFor(delay);

        enqueue(request.toObject());
    }

    // start checking for jobs
    return async function checkSchedule() {
        const endOfInterval = new Date(Date.now() + interval);

        // 1. findAndUpdate SCHEDULED jobs to be executed
        const requests = await apiClient.read({
            state: 'SCHEDULED',
            date : {
                $lte: endOfInterval
            }
        });

        debug(`Scheduling ${requests.length} requests`);

        // 2. loop ->
        for (const request of requests) {
            // let delay = <time between now & when job should be run>
            // make sure atomic
            const isAtomic = await assureAtomic(request);

            if (!isAtomic) {
                debug(`Some other job is fiddling with '${request._id}'. Skipping run.`);
                continue;
            }

            // pass to queue
            const job = await createJob(request);

            // set state to QUEUED
            request.state = 'QUEUED';

            await request.saveAsync();
        }
    };
}
