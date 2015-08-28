import _ from 'lodash';
import kue from 'kue';

import Promise from 'bluebird';

import RequestSchema from './schemas/Request';

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
        interval   : 5000, // check mongodb every 5 sec
    }, opts);

    // init kue
    const queue = kue.createQueue(opts.kue);

    queue.process('request', opts.concurrency, async function(job, done) {
        setTimeout( () => done(), 1000);
    });

    // init mongo
    const mongooseConnection = mongoose.createConnection(opts.mongodb.url);

    const Request = mongooseConnection.model('Request', RequestSchema);

    async function updateRequest(request, data) {
        data = _.pick(data, Request.editableFields());
        _.defaultsDeep(request, data);

        await request.saveAsync();

        return request;
    }

    async function create(data) {
        let request = new Request();

        await updateRequest(request, data);

        return request;
    }

    async function findAll(query) {
        const items = await Request.findAsync(query);

        return items;
    }

    async function findOneById(id) {
        const item = await Request.findByIdAsync(id);

        if (!item) {
            let error = new Error(`Request with id '${id}' not found.`);
            error.statusCode = 404;
            throw error;
        }

        return item;
    }

    async function updateById(id, data) {
        let request = await findOneById(id);

        await updateRequest(request, data);

        return request;
    }

    async function deleteById(id) {
        // ensure it exists or throw error
        await findOneById(id);

        await Request.removeAsync({_id: id});
    }


    // start checking for jobs
    async function checkSchedule() {
        await new Promise((resolve) => { setTimeout(resolve, 100); });
        // 1. findAndUpdate {state: QUEUED} jobs to be executed
        // 2. loop ->
            // 1. let delay = <time between now & when job should be run>
            // 2. pass to kue with `delay`
            // 3. set request.job_id
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

    checkScheduleLoop();

    return {
        queue: queue,
        kue  : kue,

        create: create,
        read  : findAll,
        update: updateById,
        delete: deleteById,
        readId: findOneById,
    };
}
