import {Schema} from 'mongoose';

var Headers = new Schema({
    key  : {type: String, required: true },
    value: {type: String, required: true },
});

export default Headers;
