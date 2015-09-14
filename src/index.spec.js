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

    after((done) => {
        tt.loop.stop();
        tt.queue.shutdown(1000, done);
    });

    describe('should expose', () => {
        it('an object', () => {
            expect(tt).to.be.an('object');
        });

        it('kue', () => {
            const {kue} = tt;

            expect(kue).to.be.an.object;
        });

        it('loop', () => {
            const {loop} = tt;

            expect(loop).to.be.an('object');
            expect(loop.start).to.be.a('function');
            expect(loop.stop).to.be.a('function');
        });

        it('kue queue', () => {
            const {queue} = tt;

            expect(queue).to.be.an('object');
            expect(queue.create).to.be.a('function');
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
