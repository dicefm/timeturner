import _ from 'lodash';
import kue from 'kue';
import Promise from 'bluebird';

const debug = require('debug')('dice:timeturner:kue');

export default function(opts) {
    opts = _.assign({
        jobName: 'request',
    }, opts);

    const {kue: kueOpts, processRequest, concurrency, apiClient, jobName} = opts;

    // init kue
    const queue = kue.createQueue(kueOpts);

    function getKueJobById(id) {
        return new Promise((resolve, reject) => {
            kue.Job.get(id, function(err, job){
                if (err) {
                    reject(err);
                } else {
                    resolve(job);
                }
            });
        });
    }

    // process jobs
    queue.process(jobName, concurrency, processRequest);

    function finishedJob(type) {
        return async function(id, result) {
            try {
                const job = await getKueJobById(id);

                const {_id, method, url, body} = job.data;

                debug(`${type} ${_id}: ${method} to ${url} with body ${JSON.stringify(body)}`);
                apiClient.setState(_id, type);
            } catch (e) {
                debug('Something went wrong!', e);
            }
        };
    }

    queue.on('job complete', finishedJob('SUCCESS'));
    queue.on('job failed', finishedJob('FAIL'));


    return queue;
};
