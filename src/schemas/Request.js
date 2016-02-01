import {Schema} from 'mongoose';

import HTTPHeader from './HTTPHeader';

import timestampPlugin from './plugins/timestamp';
import headersPlugin from './plugins/headers';

const SUPPORTED_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const STATES = ['SCHEDULED', 'QUEING', 'QUEUED', 'RUNNING', 'SUCCESS', 'ERROR'];

const Request = new Schema({
    url    : {type: String, required: true, trim: true },
    date   : {type: Date, required: true },
    method : {type: String, enum: SUPPORTED_HTTP_METHODS, required: true },
    body   : {type: Schema.Types.Mixed },
    state  : {type: String, enum: STATES, required: true, default: 'SCHEDULED' },
    job_id : {type: String},
    notes  : {type: Schema.Types.Mixed},
    error  : {type: Schema.Types.Mixed, default: null},
    timeout: {type: Number},
});

Request.plugin(timestampPlugin);
Request.plugin(headersPlugin);


Request.statics.editableFields = function() {
    return [
        'url',
        'date',
        'method',
        'body',
        'headers',
        'notes',
        'state',
        'timeout',
    ];
};

Request.options.toJSON.transform = function(doc, ret, options) {
    delete ret.__v;

    return ret;
};

export default Request;
