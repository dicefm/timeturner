import _ from 'lodash';
import kue from 'kue';

import Promise from 'bluebird';

import RequestSchema from './schemas/Request';

const mongoose = Promise.promisifyAll(require('mongoose'));


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
    }, opts);

    // init kue
    const queue = kue.createQueue(opts.kue);

    queue.process('request', opts.concurrency, async function(job, done) {
        setTimeout( () => done(), 1000);
    });

    // init mongo
    const mongooseConnection = mongoose.createConnection(opts.mongodb.url);

    const Request = mongoose.model('Request', RequestSchema);

    function noop() {}


    return {
        queue: queue,
        kue  : kue,

        create: noop,
        read  : noop,
        update: noop,
        delete: noop,
    };
}
