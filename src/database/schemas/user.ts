import { Schema, model, Model, Document } from 'mongoose';

interface userProfile extends Document {
    userID: string,
    randID: string
}

const schema = new Schema({
    userID: {
        type: String,
        required: true
    },

    randID: {
        type: String,
        required: true
    }
}, {versionKey: false});

const USER_SCHEMA = model('profile', schema, 'profile');

export default USER_SCHEMA;
