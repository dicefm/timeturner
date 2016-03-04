import _ from 'lodash';
import request from 'request-promise';
import HTMLEntities from 'he';

const debug = require('debug')('dice:timeturner:request-processor');

function isJSONRequest(reqOpts) {
    const contentType = reqOpts.headers['content-type'];

    if (contentType && contentType !== 'application/json') {
        return false;
    }

    return true;
}

export default function(opts) {
    return async function(job) {
        const {url, headers, body, method} = job;

        let reqOpts = {
            uri    : url,
            headers: headers,
            method : method,
            body   : body,

            resolveWithFullResponse: true,
        };

        if (isJSONRequest(reqOpts)) {
            reqOpts.json = true;
        }

        debug('performing request', reqOpts);

        const response = await request(reqOpts);

        return response;
    };
}
