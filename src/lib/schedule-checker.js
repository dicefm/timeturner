import _ from 'lodash';
import moment from 'moment';

const debug = require('debug')('dice:timeturner:schedule-checker');

export default function(opts) {
    opts = _.assign({
        Request  : null,
        apiClient: null,
        interval : 500,
    }, opts);

    const {Request, apiClient, interval} = opts;

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
        for (let request of requests) {
            // 1. let delay = <time between now & when job should be run>
            // make sure atomic
            const response = await Request.updateAsync({
                _id  : request._id,
                state: 'SCHEDULED',
            }, {
                $set: {
                    state: 'QUEUED'
                }
            }, {
                multi: true,
            });

            if (response.nModified !== 1) {
                debug(`Something else is fiddling with '${request._id}'. Skipping run.`);
                continue;
            }

            let delay = moment(request.date).diff(moment());
            debug(`Scheduling ${request.method} to ${request.url} in ${delay} ms`);

            if (delay < 0) {
                debug(`Whoops. Seems like this has been delayed a bit.`);
                delay = 0;
            }

            // 2. pass to kue with `delay`
            // 3. set request.job_id
        }
    };
}
