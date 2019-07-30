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
let UserModel = require('./models/user');
let MessageModel = require('./models/message');
let GroupModel = require('./models/group');
let http = require('http').Server(app);
let core = require('./libs/core');
// let req = require('request');
app.set('port', process.env.PORT || config.port || 4000);
let server = app.listen(app.get('port'), function(req, res) {
  core.logger.info('网站启动端口： '+ server.address().port);
  core.logger.info('环境变量： '+ config.env);
  core.logger.info('mongodb url' + config.mongodb.uri);
  core.logger.info('redis url' + config.redis.host+ ":" + config.redis.port);
})
let io = require('socket.io')(server);

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


let users = [];
let usersInfo = [];
// 每个人连接用户都有专有的socket
io.on('connection', async (socket) => {
  // 在线人员
  console.log('connect success');
  // 会首先进入 你所在的groups中的第一个group
  let groups = await GroupModel.find({});
  io.emit('displayUser', usersInfo);
  io.emit('disPlayGroups', groups);
  // 登录验证
  socket.on('login', async (user) => {
    let loginUser = await UserModel.findOne({name: user.name});
    if (!loginUser) {
      // 该用户不存在
      socket.emit('nouser');
    } else if (users.indexOf(user.name) > -1) {
      socket.emit('loginError'); // 该用户已登录 不能把别人挤下去（暂时）
    } else if (!user.name || !user.password) {
      core.logger.info('用户名或者密码不能为空');
      socket.emit('parameterError');
    } else if (loginUser.authenticate(user.password)) {
      // 用户验证成功、(显示在线人数，和可选的群组)
      users.push(user.name);
      usersInfo.push({
        ...user,
        img: loginUser.img
      });
      
      socket.emit('loginSuccess');
      socket.nickname = user.name;
      // 只能进默认的群组（暂时），应该是可以选择群组进去
      io.emit('system', {
        name: user.name,
        status: '进入'
      })
      io.emit('displayUser',usersInfo);
      io.emit('disPlayGroups', groups);
      await UserModel.update({_id: loginUser._id}, {$set: {
        online: true
      }})
      core.logger.info(users.length + 'user connnect.');
    } else {
      // 验证失败
      io.emit('authenticationError');

    }
  });
  // 注册用户
  socket.on('register', async (user) => {
    console.log('注册用户user')
    if (!user.name || !user.password) {
      core.logger.info('注册：用户名或者密码不能为空');
      io.emit('parameterError');
    } 
    let regUser = await UserModel.findOne({name: user.name});
    let length = await UserModel.countDocuments({});
    if (regUser) {
      // 用户名被占用
      io.emit('nameerror');
    } else {
      let newuser = {
        name: user.name,
        password: user.password,
        id: length + 1,
        img: user.img
      }
      let _newuser = new UserModel(newuser);
      await _newuser.save();
      socket.emit('registerSuccess');
    }
    
  })
  // 发送抖动窗口
  socket.on('shake', () => {
    socket.emit('shake', {
      name: '您'
    });
    socket.broadcast.emit('shake', {
      name: socket.nickname
    });
  })
  // 发送消息事件
  socket.on('sendMsg', async (data) => {
    let img = '';
    for (let i = 0; i < usersInfo.length; i++) {
      if (usersInfo[i].name == socket.nickname) {
        img = usersInfo[i].img;
      }
    }
    socket.broadcast.emit('receiveMsg', {
      name: socket.nickname,
      img: img,
      msg: data.msg,
      color: data.color,
      type: data.type,
      side: 'left'
    });
    socket.emit('receiveMsg', {
      name: socket.nickname,
      img: img,
      msg: data.msg,
      color: data.color,
      type: data.type,
      side: 'right'
    })
    let _user = await UserModel.findOne({name: socket.nickname});
    let newMsg = {
      author: _user._id,
      content: data.msg,
      // group: ........
    }
    let _newMsg = new MessageModel(newMsg);
    _newMsg.save();
    core.logger.info('发送消息成功');
  });
  // 断开连接时
  socket.on('disconnect', async () => {
    let index = users.indexOf(socket.nickname);
    if (index > -1) {
      users.splice(index, 1); // 删除用户信息
      usersInfo.splice(index, 1);

      io.emit('system', {
        name: socket.nickname,
        status: '离开'
      });
      await UserModel.update({name: socket.nickname}, {
        $set: {
          online: false
        }
      })
      io.emit('displayUser', usersInfo);   // 重新渲染在线人员
      core.logger.info('a user left.')
    }
  })

})


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


module.exports = app;
