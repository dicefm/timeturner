import _ from 'lodash';

export default function() {
    let i = 0;
    return async function(job, done) {
        i++;
        setTimeout(function() {
            if (i % 2) {
                done(new Error('Something went wrong!'));
            } else {
                done();
            }
        }, _.random(1000, 5000));
    };
}
