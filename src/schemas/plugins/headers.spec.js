import Promise from 'bluebird';

const mongoose = Promise.promisifyAll(require('mongoose'));

const Schema = mongoose.Schema;

import headersPlugin from './headers';

describe('headersPlugin', () => {
    let dbConnection;
    let SimpleModel;
    let db;
    let entry;

    before(() => {
        db = mongoose.createConnection('mongodb://localhost:27017/mongoose_headers_tests');

        const SimpleSchema = new Schema({
            name: String,
        });

        SimpleSchema.plugin(headersPlugin);

        SimpleModel = db.model('SimpleModel', SimpleSchema);
    });

    after(() => {
        db.close();
    });


    beforeEach(() => {
        entry = new SimpleModel();
    });

    it('should be a function', () => {
        expect(headersPlugin).to.be.a.function;
    });


    describe('when using on a schema w/ options', () => {
        let SimpleSchemaWithOptions;
        before(() => {
            SimpleSchemaWithOptions = new Schema({
                name: String,
            });
            SimpleSchemaWithOptions.options.toObject = {foo: 'bar'};
            SimpleSchemaWithOptions.options.toJSON = {foo: 'bar'};
        })
        it('should not override the default ones', () => {
            SimpleSchemaWithOptions.plugin(headersPlugin);

            expect(SimpleSchemaWithOptions.options.toObject.foo).to.eq('bar');
            expect(SimpleSchemaWithOptions.options.toJSON.foo).to.eq('bar');
        });
    });

    describe('when creating entry', () => {
        it('should have a default value', () => {
            expect(entry.headers).to.deep.eq({});
            expect(entry.toObject().headers).to.deep.eq({});
        });
        it('that is unique per instance', () => {
            let entry2 = new SimpleModel();

            expect(entry.headers).to.not.eq(entry2.headers);

            entry2.headers.foo = 'bar';

            expect(entry.headers).to.not.deep.eq(entry2.headers);
            expect(entry.toObject().headers).to.not.deep.eq(entry2.toObject().headers);
            expect(entry2.toObject().headers).to.deep.eq({foo: 'bar'});
            expect(entry.toObject().headers).to.deep.eq({});
        });
    });

    describe('when validating', () => {
        it('should only allow objects for headers', () => {
            entry.headers = [];

            let err = entry.validateSync();
            expect(err.name).to.eq('ValidationError');
        });

        it('should only allow strings for values', () => {
            entry.headers['Authorization'] = 123;

            let err = entry.validateSync();


            expect(err.name).to.eq('ValidationError');
        });
    });


    describe('when saving', () => {
        it('should make all header keys lowercase', (done) => {
            entry.headers = {
                'Authorization': 'foo Bar',
                'Content-Type' : 'application/json',
            };

            entry.save((err) => {
                expect(err).to.not.be.ok;

                expect(entry.headers).to.deep.equal({
                    'authorization': 'foo Bar',
                    'content-type' : 'application/json',
                });

                done();
            });
        });
    });

    describe('when doing toObject', () => {
        it('should show the headers', async () => {
            entry.headers = {
                Authorization: 'yo',
            };
            await entry.saveAsync();
            expect(entry.toObject().headers).to.deep.eq({
                authorization: 'yo',
            });
        });

        it('or the default value if there was none', async () => {
            let results = await entry.saveAsync();

            entry = await SimpleModel.findByIdAsync(results[0]);

            expect(entry.toObject().headers).to.deep.eq({});
        });
    });

    describe('when doing toJSON', () => {
        it('should show the headers', async () => {
            entry.headers = {
                Authorization: 'yo',
            };
            await entry.saveAsync();
            expect(entry.toJSON().headers).to.deep.eq({
                authorization: 'yo',
            });
        });

        it('or the default value if there was none', async () => {
            let results = await entry.saveAsync();

            entry = await SimpleModel.findByIdAsync(results[0]);

            expect(entry.toJSON().headers).to.deep.eq({});
        });
    });
});
