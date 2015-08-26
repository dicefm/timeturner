'use strict';

import express from 'express';
import morgan from 'morgan';

import bodyParser from 'body-parser';

import timeturnerMiddleware from '../../src/middleware/express';

const debug = require('debug')('dice:timeturner:express');

const server = express();
server.use(morgan('combined'));
server.set('state namespace', 'App');

server.use(bodyParser.json());


server.use('/schedule', timeturnerMiddleware());



const port = process.env.PORT || 2015;
server.listen(port);
debug('Listening on port ' + port);

export default server;
