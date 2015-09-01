import _ from 'lodash';
import kue from 'kue';
import moment from 'moment';

import Promise from 'bluebird';

import RequestSchema from './schemas/Request';
import api from './lib/api';
import looper from './lib/looper';
import scheduleChecker from './lib/schedule-checker';

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

    const {kue: kueOpts, mongodb, concurrency, interval, autoStart} = opts;

    // init kue
    const queue = kue.createQueue(kueOpts);

    queue.process('request', concurrency, async function(job, done) {
        setTimeout( () => done(), 1000);
    });

    // init mongo
    const mongooseConnection = mongoose.createConnection(mongodb.url);

    const Request = mongooseConnection.model('Request', RequestSchema);

    const apiClient = api({Request: Request});

    const checkSchedule = scheduleChecker({
        Request  : Request,
        apiClient: apiClient,
        interval : interval,
    });

    Request.updateAsync({
        }, {
            $set: {
                state: 'SCHEDULED'
            }
        }, {
            multi: true,
        });

    const loop = looper({
        interval : interval,
        autoStart: autoStart,
        fn       : checkSchedule,
    });

    return {
        queue: queue,
        kue  : kue,

        start: loop.start,
        stop : loop.stop,

        create: apiClient.create,
        read  : apiClient.read,
        update: apiClient.update,
        delete: apiClient.delete,
        readId: apiClient.readId,
    };
}
