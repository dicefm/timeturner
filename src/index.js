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
    }, opts);

    // init kue
    const queue = kue.createQueue(opts.kue);

    queue.process('request', opts.concurrency, async function(job, done) {
        setTimeout( () => done(), 1000);
    });

    // init mongo
    const mongooseConnection = mongoose.createConnection(opts.mongodb.url);

    const Request = mongooseConnection.model('Request', RequestSchema);

    async function create(data) {
        let request = new Request();

        data = _.pick(data, Request.editableFields());
        _.defaultsDeep(request, data);

        await request.saveAsync();

        return request.toJSON();
    }

    async function findAll(query) {
        const items = await Request.findAsync(query);

        return Request.toJSON(items);
    }

    async function findOne(id) {
        const item = await Request.findByIdAsync(id);

        if (!item) {
            let error = new Error(`Request with id '${id}' not found.`);
            error.statusCode = 404;
            throw error;
        }

        return item.toJSON();
    }

    async function noop() {}


    return {
        queue: queue,
        kue  : kue,

        create: create,
        read  : findAll,
        update: noop,
        delete: noop,
        readId: findOne,
    };
}
