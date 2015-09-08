import {Schema} from 'mongoose';
import {isPlainObject} from 'lodash';

function headersValidator(headers) {
    if (!isPlainObject(headers)) {
        return false;
    }

    for (const key in headers) {
        const value = headers[key];

        if (typeof value !== 'string') {
            return false;
        }
    }

    return true;
}

export default function(schema, opts) {
    schema.options.toObject = schema.options.toObject || {};
    schema.options.toJSON = schema.options.toJSON || {};

    schema.options.toObject.minimize = false;
    schema.options.toJSON.minimize = false;

    schema.add({
        headers: {type: Schema.Types.Mixed, required: true, default: {}, validate: headersValidator},
    });

    schema.pre('save', function(next) {
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

};
