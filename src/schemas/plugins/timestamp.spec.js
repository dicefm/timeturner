import Promise from 'bluebird';

const mongoose = Promise.promisifyAll(require('mongoose'));

const Schema = mongoose.Schema;

import timestampPlugin from './timestamp';

describe('timestampPlugin', () => {
    let dbConnection;
    let SimpleModel;
    let db;
    let entry;
    const timestampBefore = new Date;

    before(() => {
        db = mongoose.createConnection('mongodb://localhost:27017/mongoose_timestamp_tests');

        const SimpleSchema = new Schema({
            name: String,
        });

        SimpleSchema.plugin(timestampPlugin);

        SimpleModel = db.model('SimpleModel', SimpleSchema);
    });

    after((done) => {
        SimpleModel.remove({}, function() {
            db.close();
            done();
        });
    });

    it('should be a function', () => {
        expect(timestampPlugin).to.be.a.function;
    });

    describe('when calling save()', () => {
        beforeEach(() => {
            entry = new SimpleModel();
            entry.name = 'TestModel';
        });

        afterEach(() => {
        });

        describe('if it\'s a new entry', () => {
            it('should set both created_at/updated_at', (done) => {
                entry.save((err) => {
                    expect(err).to.not.be.ok;

                    const timestampAfter = new Date;

                    expect(entry.model.meta.created_at).to.be.afterTime(timestampBefore);
                    expect(entry.model.meta.updated_at).to.be.afterTime(timestampBefore);

                    expect(entry.model.meta.created_at).to.be.beforeTime(timestampAfter);
                    expect(entry.model.meta.updated_at).to.be.beforeTime(timestampAfter);

                    expect(entry.model.meta.created_at).to.be.equalTime(entry.model.meta.updated_at);

                    done();
                });
            });
        });


        describe('if it\'s an existing entry', () => {
            it('should set updated_at to now w/o updating created_at', (done) => {
                let timestampBeforeUpdate;
                let createdAt;

                entry.saveAsync()
                    .then(() => {
                        expect(entry.model.meta.created_at).to.be.equalTime(entry.model.meta.updated_at);

                        timestampBeforeUpdate = new Date;
                        createdAt = entry.model.meta.created_at;
                        return entry.saveAsync();
                    })
                    .then(() => {
                        const timestampAfter = new Date;

                        expect(entry.model.meta.created_at).to.be.equalTime(createdAt);

                        expect(entry.model.meta.updated_at).to.be.afterTime(createdAt);
                    })
                    .then(done)
                    .catch(done)
                    ;
            });
        });
    });


    describe('when calling update()', () => {
        let timestampBeforeUpdate;
        let $set;

        const conditions = {
            name: 'TestModel ShouldBeUpdated',
        };


        beforeEach(function(done) {
            $set = {
                name: `TestModel ${Math.random()}`,
            };
            Promise.all([
                new SimpleModel({name: 'TestModel ShouldBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldNotBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldNotBeUpdated'}).saveAsync(),
            ])
            .then(() => {
                timestampBeforeUpdate = new Date();

                return SimpleModel.updateAsync(conditions, {
                    $set: $set,
                });
            })
            .then(() => { done() })
            .catch(done);
        });

        it('should set updated_at to now w/o updating created_at', (done) => {
            SimpleModel.findAsync($set).then((entries) => {
                const timestampAfter = new Date;
                expect(entries.length).to.be.above(0);

                entries.forEach((entry) => {
                    expect(entry.model.meta.updated_at).to.be.afterTime(timestampBefore);
                    expect(entry.model.meta.created_at).to.be.beforeTime(timestampBeforeUpdate);
                });
            })
            .then(done)
            .catch(done);
        });

        it('should NOT set updated_at to on anything the query didn\'t match', (done) => {
            let negatedSet = {};
            for (const key in $set) {
                negatedSet[key] = {$ne: $set[key]};
            }
            SimpleModel.findAsync(negatedSet, {}).then((entries) => {
                const timestampAfter = new Date;
                expect(entries.length).to.be.above(0);

                entries.forEach((entry) => {
                    expect(entry.model.meta.updated_at).to.be.beforeTime(timestampBeforeUpdate);
                });
            })
            .then(done)
            .catch(done);
        });
    });
});
