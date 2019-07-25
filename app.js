'use strict';
let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let marked = require('marked');
let compression = require('compression')
let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let config = require('./config/config');
let app = express();
let appPath = process.cwd();
let mongoose = require('mongoose');
let moment = require('moment');
let _ = require('lodash');
let session = require('express-session');
let core = require('./libs/core');
marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  smartLists: true,
  smartypants: false
})
app.use(compression());

// 连接数据库
mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb.uri, { useNewUrlParser: true }).then(db => {
  console.log('mongodb连接成功')
}, function(err) {
  console.log('mongodb连接失败', err);
})
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.locals = {
  title: config.title || 'Chat',
  pretty: true,
  moment: moment,
  _: _,
  config: config,
  env: config.env
}
app.set('config', config);

app.use(session({
  resave: true,
  cookie: {
    maxAge: 86400000     // 1 day
  },
  saveUninitialized: true,
  secret: config.sessionSecret || 'chat',
}))
app.use('/', indexRouter);
app.use('/users', usersRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.set('port', process.env.PORT || config.port || 4000);
let server = app.listen(app.get('port'), function() {
  core.logger.info('网站启动端口： '+ server.address().port);
  core.logger.info('环境变量： '+ config.env);
  core.logger.info('mongodb url' + config.mongodb.uri);
  core.logger.info('redis url' + config.redis.host+ ":" + config.redis.port);
})

module.exports = app;
