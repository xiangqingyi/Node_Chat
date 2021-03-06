'use strict';

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// 消息模型
let MessageSchema = new Schema({
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    content: {
        type: String
    },
    type: {
        type: String,
    },
    group: {
        type: Schema.ObjectId,
        ref: 'Group'
    },
    groupid: {
        type: Number
    }
});

module.exports = mongoose.model('Message', MessageSchema);