import _ from 'lodash';
import kue from 'kue';

export default function(opts) {
    opts = _.defaultsDeep({
        kue: {
            prefix: 'q',
            redis : {
                host   : '127.0.0.1',
                port   : 6379,
                auth   : '',
                options: {
                    // see https://github.com/mranney/node_redis#rediscreateclient
                }
            }
        },
        concurrency: 5,
    }, opts);

    const queue = kue.createQueue(opts.kue);

    queue.process('request', opts.concurrency, async function(job, done) {
        setTimeout( () => done(), 1000);
    });

    return {
        queue: queue,
        kue  : kue,
    };
}
