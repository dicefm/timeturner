import _ from 'lodash';
import moment from 'moment';

const debug = require('debug')('dice:timeturner:schedule-checker');

export default function(opts) {
    opts = _.assign({
        Request  : null,
        apiClient: null,
        interval : 500,
        queue    : null,
    }, opts);

    const {Request, apiClient, interval, queue} = opts;

    /**
     * Makes sure that request is an atomic operation by updating into a QUEUED state
     *
     * @param  {Request} request
     * @return {bool}
     */
    async function assureAtomic(request) {
        const {nModified} = await Request.updateAsync({
            _id  : request._id,
            state: 'SCHEDULED',
        }, {
            $set: {
                state: 'QUEING',
            }
        });

        if (nModified !== 1) {
            return false;
        }

        return true;
    }

    async function createJob(request) {
        let delay = moment(request.date).diff(moment());
        debug(`Scheduling ${request.method} to ${request.url} in ${delay} ms`);

        if (delay < 0) {
            debug(`Whoops. Seems like this has been delayed ${Math.abs(delay)} milliseconds.`);
            delay = 0;
        }

        return new Promise((resolve, reject) => {
            let jobOpts = request.toObject();

            const {method, url} = jobOpts;

            jobOpts.title = `${method} to ${url}`;

            const job = queue
                .create('request', jobOpts)
                .delay(delay)
                .save((err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(job);
                    }
                })
                ;
        });
    }

    // start checking for jobs
    return async function checkSchedule() {
        const endOfInterval = new Date(Date.now() + interval);

        // 1. findAndUpdate {state: QUEUED} jobs to be executed
        const requests = await apiClient.read({
            state: 'SCHEDULED',
            date : {
                $lte: endOfInterval
            }
        });

        debug(`Scheduling ${requests.length} requests`);

        // 2. loop ->
        for (const request of requests) {
            // 1. let delay = <time between now & when job should be run>
            // make sure atomic
            const isAtomic = assureAtomic(request);

            if (!isAtomic) {
                debug(`Some other job is fiddling with '${request._id}'. Skipping run.`);
                continue;
            }

            // 2. pass to kue with `delay`
            const job = await createJob(request);

            // 3. set request.job_id
            request.job_id = job.id;

            // 4. set state to QUEUED
            request.state = 'QUEUED';

            await request.saveAsync();
        }
    };
}
