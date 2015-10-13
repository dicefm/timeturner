'use strict';

import express from 'express';
import morgan from 'morgan';
import url from 'url';
import cors from 'cors';

import timeturner from '../../src/index';

const debug = require('debug')('dice:timeturner:express');

const {PORT, MONGO_URL} = process.env;

const server = express();
server.use(morgan('combined'));

server.use(cors());

let opts = {};

if (MONGO_URL) {
    opts.mongodb = {url: MONGO_URL};
}


const tt = timeturner(opts);


tt.RequestSchema.path('url').validate(function (value) {
    const {host} = url.parse(value);

    return /\.dice\.fm$/.test(host);
}, 'URL needs to match *.dice.fm');

tt.RequestSchema.path('url').validate(function (value) {
    const {search} = url.parse(value);

    return !search;
}, 'You\'re not allowed to pass any query params to the URL');


server.use('/schedule', tt.expressMiddleware());



const port = PORT || 2015;
server.listen(port);
debug('Listening on port ' + port);

export default server;
