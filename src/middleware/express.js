import _ from 'lodash';
import express from 'express';

import bodyParser from 'body-parser';
import timeturner from '../index';

const debug = require('debug')('dice:timeturner:express-middleware');



async function performAndRespond(promise, res) {
    try {
        let data = await promise;
        if (_.isUndefined(data)) {
            res.sendStatus(204);
        } else {
            res.send(data);
        }
    } catch (err) {
        failedOperationResponse(err, res);
    }
}


/**
 * Takes an error object from a mongoose `save()` call and sends a digestable output to client
 */
function failedOperationResponse(err, res) {
    const statusCode = err.statusCode || 400;
    res.status(statusCode);

    let ret = {
        description: err.message,
    };

    if (err.errors) {
        let errors = {};
        for (let key in err.errors) {
            errors[key] = err.errors[key].message;
        }
        ret.errors = errors;
    }
    res.send(ret);
}


export default function(opts) {
    const {api, kue} = opts;

    const router = express.Router();

    router.use(bodyParser.json());

    // create
    router.post('/', function(req, res, next) {
        performAndRespond(api.create(req.body), res);
    });

    // read
    router.get('/', function(req, res, next) {
        performAndRespond(api.read(req.query), res);
    });

    router.get('/:id', function(req, res, next) {
        performAndRespond(api.readId(req.params.id), res);
    });

    // update
    router.patch('/:id', function(req, res, next) {
        performAndRespond(api.update(req.params.id, req.body), res);
    });

    // delete
    router.delete('/:id', function(req, res, next) {
        performAndRespond(api.delete(req.params.id), res);
    });


    router.use('/_kue/', kue.app);


    return router;
}

