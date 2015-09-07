import looper from './looper';

describe('looper', () => {
    let loop;
    let spy;
    let asyncFn;
    let clock;

    function refreshSpy() {
        spy = sinon.spy();
        asyncFn = function() {
            return new Promise(function(resolve) {
                spy();
                resolve();
            });
        };
    }

    function clockTick(ms) {
        ms = ms || 0;
        clock.tick(ms);
        return new Promise((resolve) => {
            resolve();
        });
    }

    describe('when creating', () => {
        describe('with autoStart=true', () => {
            beforeEach(() => {
                refreshSpy();
                loop = looper({
                    fn       : asyncFn,
                    autoStart: true,
                });
            });
            afterEach(() => {
                loop.stop();
            });
            it('should call `fn` once immediately', () => {
                expect(spy).to.have.been.calledOnce;
            });
            it('should not do anything on an accidental second `start()` call', () => {
                loop.start();
                expect(spy).to.have.been.calledOnce;
            });
        });

        describe('with non-function `fn`', () => {
            it('should throw an error', () => {
                expect(function() {
                    loop = looper({
                        fn: null,
                    });
                }).to.throw(`'opts.fn' needs to be a function. ${typeof null} received`);
            });
        });

        describe('with autoStart=false', () => {
            beforeEach(() => {
                refreshSpy();
                loop = looper({
                    fn       : asyncFn,
                    autoStart: false,
                    interval : 500,
                });
            });
            afterEach(() => {
                loop.stop();
            });

            it('should not call `fn` immediately', () => {
                expect(spy).to.have.been.notCalled;
            });

            it('should call `fn` once immediately after calling start()', () => {
                loop.start();
                expect(spy).to.have.been.calledOnce;
            });
        });
    });

    describe('when time passes', () => {
        let interval = 10;
        beforeEach(() => {
            clock = sinon.useFakeTimers();
            spy = sinon.spy();
            loop = looper({
                fn       : asyncFn,
                autoStart: false,
                interval : interval,
            });
        });

        afterEach(() => {
            loop.stop();
            clock.restore();
        });

        it('should call `fn` once in every interval', async function(done) {
            try {
                loop.start();

                expect(spy).to.have.been.calledOnce;

                await clockTick(1);
                await clockTick(interval);

                expect(spy).to.have.been.calledTwice;

                await clockTick(interval);

                expect(spy).to.have.been.calledTrice;

                done();
            } catch (e) {
                done(e);
            }
        });
    });

    describe('when cycle is slow', () => {
        let interval = 10;
        let cycle = interval*2;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            spy = sinon.spy();
            loop = looper({
                fn: function() {
                    asyncFn();

                    return new Promise((resolve) => {
                        setTimeout(resolve, interval*2);
                    })
                },
                autoStart: false,
                interval : interval,
            });
        });

        afterEach(() => {
            loop.stop();
            clock.restore();
        });

        it('shouldnt call `fn` if the first cycle isnt completed', async function(done) {
            try {
                loop.start();

                expect(spy).to.have.been.calledOnce;

                await clockTick(cycle-1);

                expect(spy).to.have.been.calledOnce;

                await clockTick(1);
                await clockTick(1);

                expect(spy).to.have.been.calledTwice;

                done();
            } catch (e) {
                done(e);
            }
        });
    })
});
