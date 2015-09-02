import {Schema} from 'mongoose';

import HTTPHeader from './HTTPHeader';

const SUPPORTED_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const STATES = ['SCHEDULED', 'QUEING', 'QUEUED', 'SUCCESS', 'ERROR'];

function headersValidator(headers) {
    if (typeof headers !== 'object') {
        return false;
    }

    for (const key in headers) {
        const value = headers[key];

        if (typeof key !== 'string') {
            return false;
        }
        if (typeof value !== 'string') {
            return false;
        }
    }

    return true;
}

const Request = new Schema({
    url    : {type: String, required: true, trim: true },
    date   : {type: Date, required: true },
    method : {type: String, enum: SUPPORTED_HTTP_METHODS, required: true },
    body   : {type: Schema.Types.Mixed },
    headers: {type: Schema.Types.Mixed, required: true, default: {}, validate: headersValidator},
    state  : {type: String, enum: STATES, required: true, default: 'SCHEDULED' },
    job_id : {type: String},

    'model.meta.created_at': { type: Date },
    'model.meta.updated_at': { type: Date },
});


Request.pre('save', function(next) {
    let now = new Date();

    this.model.meta.updated_at = now;
    if (!this.model.meta.created_at) {
        this.model.meta.created_at = now;
    }

    next();
});

Request.pre('save', function(next) {
    // lowercase all header keys
    let headers = this.headers;

    for (const key in headers) {
        const keyLowerCase = key.toLowerCase();

        if (key !== keyLowerCase) {
            const value = headers[key];

            headers[keyLowerCase] = value;
            delete headers[key];
        }
    }

    next();
});


Request.statics.editableFields = function() {
    return [
        'url',
        'date',
        'method',
        'body',
        'headers',
    ];
};

Request.options.toJSON = {
    transform: function(doc, ret, options) {
        delete ret.__v;

        return ret;
    }
};

Request.statics.toJSON = function(docs, callback) {
    return docs.map(function(doc) {
        return doc.toJSON();
    });
};

export default Request;
