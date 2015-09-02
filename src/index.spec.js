import index from './index';

describe('index', () => {
    it('should work', () => {
        expect(index({autoStart: false})).to.be.ok;
    });
});
