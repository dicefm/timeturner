'use strict';

import express from 'express';
import morgan from 'morgan';

import bodyParser from 'body-parser';

const debug = require('debug')('dice:time-turner:express');

const server = express();
server.use(morgan('combined'));
server.set('state namespace', 'App');

server.use(bodyParser.json());



const port = process.env.PORT || 2015;
server.listen(port);
debug('Listening on port ' + port);

export default server;
