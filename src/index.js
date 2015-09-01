import _ from 'lodash';
import kue from 'kue';
import moment from 'moment';

import Promise from 'bluebird';

import RequestSchema from './schemas/Request';
import api from './lib/api';

const mongoose = Promise.promisifyAll(require('mongoose'));

const debug = require('debug')('dice:timeturner:index');

export default function(opts) {
    opts = _.defaultsDeep({
        kue: {
            prefix: 'q',
            redis : {
                host   : '127.0.0.1',
                port   : 6379,
                auth   : '',
                options: {
                    // see https://github.com/mranney/node_redis#rediscreateclient
                }
            }
        },
        mongodb: {
            url: 'mongodb://127.0.0.1:27017/timeturner',
        },
        concurrency: 5,
        interval   : 500, // check mongodb every X ms
        autoStart  : true,
    }, opts);

    // init kue
    const queue = kue.createQueue(opts.kue);

    queue.process('request', opts.concurrency, async function(job, done) {
        setTimeout( () => done(), 1000);
    });

    // init mongo
    const mongooseConnection = mongoose.createConnection(opts.mongodb.url);

    const Request = mongooseConnection.model('Request', RequestSchema);

    const apiClient = api(Request);


    // start checking for jobs
    async function checkSchedule() {
        const endOfInterval = new Date(Date.now() + opts.interval);

        // 1. findAndUpdate {state: QUEUED} jobs to be executed
        const requests = await apiClient.read({
            state: 'SCHEDULED',
            date : {
                $lte: endOfInterval
            }
        });

        // TODO update to QUEING straight away (make atomic)

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
    }

    /**
     * Starts a never-ending checkSchedule loop
     * Makes sure that a checkSchedule is run every `opts.interval` ms, but never two at once if slow
     *
     * @void
     */
    async function checkScheduleLoop() {
        const timeStart = new Date().getUTCMilliseconds();
        await checkSchedule();

        const timeEnd = new Date().getUTCMilliseconds();
        const diff = (timeEnd - timeStart);

        debug(`finished checkSchedule() in ${diff}ms`);

        const nextCheck = Math.max(opts.interval - diff, 0);


        setTimeout(checkScheduleLoop, nextCheck);
    }

    if (opts.autoStart) {
        checkScheduleLoop();
    }

    return {
        queue: queue,
        kue  : kue,
        start: checkScheduleLoop,

        create: apiClient.create,
        read  : apiClient.read,
        update: apiClient.update,
        delete: apiClient.delete,
        readId: apiClient.readId,
    };
}
