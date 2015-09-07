import _ from 'lodash';
import request from 'request-promise';
import HTMLEntities from 'he';

const debug = require('debug')('dice:timeturner:request-processor');

export default function(opts) {
    return async function(job, done) {
        try {
            const {data} = job;

            const {url, headers, body, method} = data;

            let reqOpts = {
                uri    : url,
                headers: headers,
                method : method,
                body   : body,

                resolveWithFullResponse: true,
            };

            if (reqOpts.headers['content-type'] === 'application/json') {
                reqOpts.json = true;
            }

            const response = await request(reqOpts);

            done(null, response);
        } catch (err) {
            err.message = HTMLEntities.encode(err.message);
            done(err);
        }
    };
}
