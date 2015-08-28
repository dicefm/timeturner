import {Schema} from 'mongoose';

import HTTPHeader from './HTTPHeader';

const SUPPORTED_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const STATES = ['SCHEDULED', 'QUEUED', 'COMPLETED'];

var Request = new Schema({
    url    : {type: String, required: true, trim: true },
    date   : {type: Date, required: true },
    method : {type: String, enum: SUPPORTED_HTTP_METHODS, required: true },
    body   : {type: Schema.Types.Mixed },
    headers: [HTTPHeader],
    state  : {type: String, enum: STATES, required: true },
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

Request.statics.editableFields = function() {
    return [
        'url',
        'date',
        'method',
        'body',
        'headers',
        'state',
    ];
};

export default Request;
