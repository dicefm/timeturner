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

    after(() => {
        db.close();
    });


    beforeEach(() => {
        entry = new SimpleModel();
        entry.name = 'TestModel';
    });

    afterEach(() => {
    });

    it('should be a function', () => {
        expect(timestampPlugin).to.be.a.function;
    });

    describe('when creating', () => {
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


    describe('when updating', () => {
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
