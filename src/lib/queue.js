import kue from 'kue';

const debug = require('debug')('dice:timeturner:kue');

export default function(opts) {
    const {kue: kueOpts, processRequest, concurrency} = opts;

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
    queue.process('request', concurrency, processRequest);

    function finishedJob(type) {
        return async function(id, result) {
            const job = await getKueJobById(id);

            const {_id, method, url, body} = job.data;

            debug(`${type} ${_id}: ${method} to ${url} with body ${JSON.stringify(body)}`);
            apiClient.setState(_id, type);
        };
    }

    queue.on('job complete', finishedJob('SUCCESS'));
    queue.on('job failed', finishedJob('FAIL'));


    return queue;
};
