import _ from 'lodash';
import request from 'request-promise';
import HTMLEntities from 'he';

const debug = require('debug')('dice:timeturner:request-processor');

const sleep = (ms) => {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

export default function(opts) {
    return async function(job) {
        const {url, headers, body, method, timeout, retries, retry_interval: retryInterval} = job;
        let reqOpts = {
            timeout,

            uri    : url,
            headers: headers,
            method : method,
            body   : body,

            resolveWithFullResponse: true,
        };

        if (reqOpts.headers['content-type'] === 'application/json') {
            reqOpts.json = true;
        }

        let attempts = 0;
        const execute = async () => {
            try {
                const response = await request(reqOpts);
                return response;
            } catch(e) {
                attempts++;
                if (attempts < retries) {
                    await sleep(retryInterval);
                    return execute();
                }
                // all attempts failed, throw error
                throw e;
            }
        };

        const response = execute();
        return response;
    };
}
