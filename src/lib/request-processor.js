import _ from 'lodash';
import request from 'request-promise';
import HTMLEntities from 'he';

const debug = require('debug')('dice:timeturner:request-processor');

export default function(opts) {
    let i = 0;
    return async function(job, done) {
        try {
            const {data} = job;

            const {url, headers, body, method} = data;

            const reqOpts = {
                uri    : url,
                headers: headers,
                method : method,
                body   : body,

                resolveWithFullResponse: true,
            };

            debug('performing request with reqOpts:', reqOpts);

            const response = await request(reqOpts);

            done(null, response);
        } catch (err) {
            debug(`ERROR ${err.statusCode} ${err.name}`);
            err.message = HTMLEntities.encode(err.message);
            done(err);
        }
    };
}
