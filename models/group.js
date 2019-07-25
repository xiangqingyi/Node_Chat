'use strict';
let mongoose = require('mongoose');
let Schema = mongoose.Schema;

// 群组模型
let GroupSchema = new Schema({
    name: {
        type: String,
        required: '请输入群组名称',
        unique: true
    },
    id: Number,
    created: {
        type: Date,
        default: Date.now
    },
    members: [{
        type: Schema.ObjectId,
        ref: 'User'
    }],
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('Group', GroupSchema);