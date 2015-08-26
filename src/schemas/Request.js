import {Schema} from 'mongoose';

import HTTPHeader from './HTTPHeader';

const SUPPORTED_HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

var Request = new Schema({
    url    : {type: String, required: true, trim: true },
    date   : {type: Date, required: true },
    method : {type: String, enum: SUPPORTED_HTTP_METHODS, required: true },
    body   : {type: Schema.Types.Mixed },
    headers: [HTTPHeader],

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


export default Request;
