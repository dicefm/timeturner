import index from './index';

describe('index', () => {
    let tt;
    it('should work', () => {
        tt = index({autoStart: false});
        expect(tt).to.be.ok;
    });

    afterEach((done) => {
        tt.queue.shutdown(done);
    });
});
