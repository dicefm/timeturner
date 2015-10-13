import _ from 'lodash';
import moment from 'moment';

import Promise from 'bluebird';

import RequestSchema from './schemas/Request';
import api from './lib/api';
import looper from './lib/looper';
import scheduleChecker from './lib/schedule-checker';
import requestProcessor from './lib/request-processor';
import expressMiddleware from './middleware/express';
import queueModule from './lib/queue';

const mongoose = Promise.promisifyAll(require('mongoose'));

const debug = require('debug')('dice:timeturner:index');

export default function(opts) {
    opts = _.merge({
        mongodb: {
            url: 'mongodb://127.0.0.1:27017/timeturner',
        },
        concurrency: 5,
        interval   : 500, // check mongodb every X ms
        autoStart  : true,
    }, opts);

    debug('Creating timeturner with options:', opts);

    const {mongodb, concurrency, interval, autoStart} = opts;


    // init mongo
    const mongooseConnection = mongoose.createConnection(mongodb.url);

    const Request = mongooseConnection.model('Request', RequestSchema);

    const apiClient = api({Request: Request});

    // init queue
    const queue = queueModule({
        apiClient     : apiClient,
        concurrency   : concurrency,
        processRequest: requestProcessor(),
    })

    const checkSchedule = scheduleChecker({
        Request  : Request,
        apiClient: apiClient,
        interval : interval,
        queue    : queue,
    });

    const loop = looper({
        interval : interval,
        autoStart: autoStart,
        fn       : checkSchedule,
    });


    function createExpressMiddleware() {
        return expressMiddleware({
            api: apiClient,
        });
    }


    return {
        loop : loop,
        api  : apiClient,
        queue: queue,

        RequestSchema: RequestSchema,
        RequestModel : Request,

        expressMiddleware: createExpressMiddleware,
    };
}
