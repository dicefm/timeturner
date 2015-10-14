import _ from 'lodash';
import express from 'express';

import bodyParser from 'body-parser';
import timeturner from '../index';
import performAndRespond from './lib/perform-and-respond';

const debug = require('debug')('dice:timeturner:express-middleware');

export default function(opts) {
    const {apiClient} = opts;

    const router = express.Router();

    router.use(bodyParser.json());

    // create
    router.post('/', function(req, res, next) {
        performAndRespond(apiClient.create(req.body), res);
    });

    // read
    router.get('/', function(req, res, next) {
        performAndRespond(apiClient.read(req.query), res);
    });

    router.get('/:id', function(req, res, next) {
        performAndRespond(apiClient.readId(req.params.id), res);
    });

    // update
    router.patch('/:id', function(req, res, next) {
        performAndRespond(apiClient.update(req.params.id, req.body), res);
    });

    // delete
    router.delete('/:id', function(req, res, next) {
        performAndRespond(apiClient.delete(req.params.id), res);
    });


    return router;
}

