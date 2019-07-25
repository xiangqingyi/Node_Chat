'use strict';

let appPath = process.cwd();
let path = require('path');
let config = {
    port: 4000,
    env: process.env.NODE_ENV || 'local',
    path: {
        logDir: appPath + '/logs'
    },
    mongodb: {
        uri: 'mongodb://127.0.0.1:27017/chat',
        options: {}
    },
    redis: {
        host: '',
        port: 6379,
        pass: ''
    },
    sessionSecret: 'SessionSecret',
    jwt: {
        secret: 'JWTSecret',
        options: {
            expiresIn: 60 * 60 * 24
        }
    },
    title: 'Chat',
    homepage: {
        dir: 'chat'
    },
    api: {
        di: 'chat/api'
    },
    // 后台相关配置
    admin: {
        dir: 'admin',
        role: {
            admin: 'admin',
            user: 'user'
        }
    }
}

module.exports = config;