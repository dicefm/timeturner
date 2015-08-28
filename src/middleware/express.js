import _ from 'lodash';
import express from 'express';

import timeturner from '../index';

const debug = require('debug')('dice:timeturner:express-middleware');


export default function(opts) {
    const router = express.Router();

    const tt = timeturner(opts);

    router.get('/', async function(req, res, next) {
        // get all scheduled requests
        res.send([]);
    });

    router.use('/_kue/', tt.kue.app);


    return router;
}
