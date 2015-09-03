import {Schema} from 'mongoose';

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

export default function(schema, opts) {
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
