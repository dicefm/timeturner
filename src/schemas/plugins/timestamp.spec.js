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
            it('should set both created_at/updated_at', async () => {
                await entry.saveAsync();

                const timestampAfter = new Date;

                expect(entry.model.meta.created_at).to.be.afterTime(timestampBefore);
                expect(entry.model.meta.updated_at).to.be.afterTime(timestampBefore);

                expect(entry.model.meta.created_at).to.be.beforeTime(timestampAfter);
                expect(entry.model.meta.updated_at).to.be.beforeTime(timestampAfter);

                expect(entry.model.meta.created_at).to.be.equalTime(entry.model.meta.updated_at);
            });
        });


        describe('if it\'s an existing entry', () => {
            it('should set updated_at to now w/o updating created_at', async () => {
                let timestampBeforeUpdate;
                let createdAt;

                await entry.saveAsync()
                expect(entry.model.meta.created_at).to.be.equalTime(entry.model.meta.updated_at);

                timestampBeforeUpdate = new Date;
                createdAt = entry.model.meta.created_at;
                await entry.saveAsync();

                const timestampAfter = new Date;

                expect(entry.model.meta.created_at).to.be.equalTime(createdAt);

                expect(entry.model.meta.updated_at).to.be.afterTime(createdAt);
            });
        });
    });


    describe('when calling update()', () => {
        let timestampBeforeUpdate;
        let $set;

        const conditions = {
            name: 'TestModel ShouldBeUpdated',
        };


        beforeEach(async () => {
            $set = {
                name: `TestModel ${Math.random()}`,
            };
            await Promise.all([
                new SimpleModel({name: 'TestModel ShouldBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldNotBeUpdated'}).saveAsync(),
                new SimpleModel({name: 'TestModel ShouldNotBeUpdated'}).saveAsync(),
            ])
            timestampBeforeUpdate = new Date();

            await SimpleModel.updateAsync(conditions, {
                $set: $set,
            });
        });

        it('should set updated_at to now w/o updating created_at', async () => {
            const entries = await SimpleModel.findAsync($set);
            const timestampAfter = new Date;
            expect(entries.length).to.be.above(0);

            entries.forEach((entry) => {
                expect(entry.model.meta.updated_at).to.be.afterTime(timestampBefore);
                expect(entry.model.meta.created_at).to.be.beforeTime(timestampBeforeUpdate);
            });
        });

        it('should NOT set updated_at to on anything the query didn\'t match', async () => {
            let negatedSet = {};
            for (const key in $set) {
                negatedSet[key] = {$ne: $set[key]};
            }
            const entries = await SimpleModel.findAsync(negatedSet, {});
            const timestampAfter = new Date;
            expect(entries.length).to.be.above(0);

            entries.forEach((entry) => {
                expect(entry.model.meta.updated_at).to.be.beforeTime(timestampBeforeUpdate);
            });
        });
    });


    describe('when calling findOneAndUpdate()', () => {
        let timestampBeforeUpdate;
        let $set;

        const conditions = {
            name: 'TestModel ShouldBeUpdated',
        };


        beforeEach(async () => {
            $set = {
                name: `TestModel ${Math.random()}`,
            };
            await Promise.all([
                new SimpleModel({name: 'TestModel ShouldBeUpdated'}).saveAsync(),
            ])
            timestampBeforeUpdate = new Date();

            await SimpleModel.findOneAndUpdate(conditions, {
                $set: $set,
            });
        });


        it('should set updated_at', async () => {
            const entry = await SimpleModel.findOne($set);
            expect(entry.model.meta.updated_at).to.be.afterTime(timestampBefore);
            expect(entry.model.meta.created_at).to.be.beforeTime(timestampBeforeUpdate);
        });
    });
});
