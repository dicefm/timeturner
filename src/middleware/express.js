import _ from 'lodash';
import express from 'express';

const debug = require('debug')('dice:time-turner:express-middleware');

export default function(opts) {
    opts = _.defaults()
    const router = express.Router();

    router.get('/', async function(req, res, next) {
        // get all scheduled requests
        res.send([]);
    });


    return router;
}
