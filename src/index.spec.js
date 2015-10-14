import timeturner from './index';

describe('timeturner', () => {
    let tt;
    before(() => {
        tt = timeturner({
            mongodb: {
                url: 'mongodb://localhost:27017/timeturner_index_tests',
            },
        });
    });

    after(() => {
        tt.loop.stop();
    });

    describe('should expose', () => {
        it('an object', () => {
            expect(tt).to.be.an('object');
        });

        it('loop', () => {
            const {loop} = tt;

            expect(loop).to.be.an('object');
            expect(loop.start).to.be.a('function');
            expect(loop.stop).to.be.a('function');
        });

        it('queue', () => {
            const {queue} = tt;

            expect(queue).to.be.an('object');
            expect(queue.push).to.be.a('function');
        });

        it('RequestModel', () => {
            const {RequestModel} = tt;

            expect(RequestModel).to.be.a('function');
        });

        it('RequestSchema', () => {
            const {RequestSchema} = tt;

            expect(RequestSchema).to.be.an('object');
        });

        it('expressMiddleware', () => {
            const {expressMiddleware} = tt;

            expect(expressMiddleware).to.be.a('function');
        });
    });
});
