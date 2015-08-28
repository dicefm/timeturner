import _ from 'lodash';
import express from 'express';

import timeturner from '../index';

const debug = require('debug')('dice:timeturner:express-middleware');



async function performAndRespond(promise, res) {
    try {
        let data = await promise;
        res.send(data);
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
    const router = express.Router();

    const tt = timeturner(opts);

    router.get('/', function(req, res, next) {
        performAndRespond(tt.read(req.query), res);
    });

    router.get('/:id', function(req, res, next) {
        performAndRespond(tt.readId(req.params.id), res);
    });

    router.post('/', function(req, res, next) {
        performAndRespond(tt.create(req.body), res);
    });

    router.use('/_kue/', tt.kue.app);


    return router;
}

