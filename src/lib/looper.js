import _ from 'lodash';

const debug = require('debug')('dice:timeturner:looper');

export default function(opts) {
    opts = _.assign({
        interval : 500, // call fn every X ms
        fn       : null,
        autoStart: true,
    }, opts);

    const {fn, interval, autoStart} = opts;

    if (!_.isFunction(fn)) {
        throw new Error(`'opts.fn' needs to be a function. ${typeof fn} received`);
    }

    let isRunning = false;
    let timer = null;

    async function loop() {
        const timeStart = new Date().getUTCMilliseconds();
        try {
            await fn();
        } catch (err) {
            debug('Something went wrong in loop!', err);
        }

        const timeEnd = new Date().getUTCMilliseconds();
        const diff = (timeEnd - timeStart);

        debug(`finished fn in ${diff}ms`);

        const nextCheck = Math.max(interval - diff, 0);

        if (isRunning) {
            timer = setTimeout(loop, nextCheck);
        }
    }

    function start() {
        if (isRunning) {
            return;
        }
        debug(`starting loop with ${interval}ms cycles.`);

        isRunning = true;
        loop();
    }

    function stop() {
        isRunning = false;
        clearTimeout(timer);
    }

    if (autoStart) {
        start();
    }

    return {
        start,
        stop,
    };
}
