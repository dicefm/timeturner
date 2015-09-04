'use strict';

import express from 'express';
import morgan from 'morgan';

import bodyParser from 'body-parser';

import timeturner from '../../src/index';
import timeturnerMiddleware from '../../src/middleware/express';

const debug = require('debug')('dice:timeturner:express');

const {PORT, MONGO_URL, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD} = process.env;

const server = express();
server.use(morgan('combined'));
server.set('state namespace', 'App');

server.use(bodyParser.json());

let opts = {};

if (MONGO_URL) {
    opts.mongodb = {url: MONGO_URL};
}

opts.kue = {
    redis: {}
};
if (REDIS_HOST) {
    opts.kue.redis.host = REDIS_HOST;
}
if (REDIS_PORT) {
    opts.kue.redis.port = REDIS_PORT;
}
if (REDIS_PASSWORD) {
    opts.kue.redis.password = REDIS_PASSWORD;
}



const tt = timeturner(opts);
server.use('/schedule', tt.expressMiddleware());



const port = PORT || 2015;
server.listen(port);
debug('Listening on port ' + port);

export default server;
