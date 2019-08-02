$(function() {
    let socket = io();
    
    // enter 登录
    $('#name, #password').keyup((event) => {
        if (event.which == 13) {
            inputLogin();
        }
    })
    $('#LoginBtn').click(inputLogin);
    $('#RegBtn').click(inputReg);
    socket.on('nouser', () => {
        alert('用户不存在');
        $('.name').val('');
        $('.password').val('');
        console.log('用户不存在');
    })
    socket.on('authenticationError', () => {
        alert('登录验证失败');
        // $('#name, #password').val('');
        console.log('密码验证失败');
    })
    socket.on('parameterError', () => {
        alert('用户名或者密码不能为空！');
        console.log('参数不能为空');
    })
    // 如果登录成功，隐藏登录层
    socket.on('loginSuccess', () => {
        console.log('登录成功');
        $('.login').hide();
        $('.name').hide();
        $('.password').hide();
        // 登录成功之后获取对应group的聊天记录
        

    })
    socket.on('loginError', () => {
        alert('该用户已登录，请勿重复登录');
        $('#name, #password').val('');
    });

    socket.on('nameerror', () => {
        alert('该用户名被占用');
        $('#name').val('');
    })
    // 触发注册事件 
    function inputReg() {
        // 暂时不能自己上传头像
        if ($('#name').val === '' || $('#password').val() === '') {
            alert('用户名或密码不能为空!');
            console.log('用户名或者密码不能为空');  
            return;
        }
        console.log('注册用户');
        let imgN = Math.floor(Math.random() * 4) + 1;
        if ($('#name, #name').val().trim() !== '') {
            socket.emit('register', {
                name: $('#name').val(),
                password: $('#password').val(),
                img: '/images/user/user'+imgN+'.jpg'
            })
        }
    }
    socket.on('registerSuccess', () => {
        alert('注册成功，请登录');
        $('#name, #password').val('');
    })
    //  触发登录事件
    function inputLogin() {
        if ($('#name').val === '' || $('#password').val() === '') {
            alert('用户名或密码不能为空!');
            console.log('用户名或者密码不能为空');  
            return;
        }
        if ($('#name').val().trim() !== '' && $('#password').val().trim() !== '') {
            socket.emit('login', {
                name: $('#name').val(),
                password: $('#password').val(),
            })
        } else {
            return false;
        }
    }
    // 系统提示消息
    socket.on('system', (user) => {
        // let data = new Date().toTimeString().substr(0, 8);
        let data = moment().format('YYYY-MM-DD HH:MM:SS')
        $('#messages').append(`<p class='system'><span>${data}</span><br /><span>
        ${user.name} ${user.status}了聊天室</span></p>`);
        // 滑动条总是在最底部
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    })

    // 抖动窗口事件
    socket.on('shake', (user) => {
        let data = new Date().toTimeString().substr(0, 8);
        $('#messages').append(`<p class="system"><span>${data}</span><br /><span>${user.name}发送了窗口抖动</span></p>`);
        shake();
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    })
    // 显示在线人员
    socket.on('displayUser', (usersInfo) => {
        displayUser(usersInfo);
    })
    // 显示可用群组
    socket.on('displayGroups', (groups) => {
        console.log(groups);
        displayGroups(groups);
    })
    // 发送消息
    $('#sub').click(sendMsg);
    $('#m').keyup((event) => {
        if (event.which == 13) {
            sendMsg();
        } 
    })
    // 接收消息
    socket.on('receiveMsg', (obj) => {
        console.log(obj);
        console.log(obj.msg)
        // 发送为图片
        if(obj.type == 'img') {
            $('#messages').append(`
              <li class='${obj.side}'>
                <img src="${obj.img}">
                <div>
                  <span>${obj.name}</span>
                  <p style="padding: 0;">${obj.msg}</p>
                </div>
              </li>
            `); 
            $('#messages').scrollTop($('#messages')[0].scrollHeight);
            return;
          }
        // 提取文字中的表情加以渲染
        let msg = obj.msg;
        let content = '';
        while(msg.indexOf('[') > -1) {
            let start = msg.indexOf('[');
            let end = msg.indexOf(']');
            content += '<span>'+msg.substr(0, start)+'</span>';
            content += '<img src="/images/emoji/emoji%20('+msg.substr(start+6, end-start-6)+').png">';
            msg = msg.substr(end+1, msg.length);
        }
        content += '<span>'+msg+'</span>';

        $('#messages').append(`
            <li  class='${obj.side}'>
               <img src="${obj.img}">
               <div>
                  <span>${obj.name}</span>
                  <p style="color: ${obj.color};">${content}</p>
               </div>
            </li>
        `);
        $('#messages').scrollTop($('#messages')[0].scrollHeight);
    });

    // 发送消息
    let color = '#000000';
    function sendMsg() {
        if ($('#m').val() == '') {
            // alert('请输入内容！');
            return false;
        }
        color = $('#color').val();
        socket.emit('sendMsg', {
            msg: $('#m').val(),
            color: color,
            type: 'text'
        });
        $('#m').val('');
        return false;
    }
    let timer;
    function shake() {
        $('.main').addClass('shaking');
        clearTimeout(timer);
        timer = setTimeout(() => {
            $('.main').removeClass('shaking');
        }, 500);
    }
    // 显示groups
    function displayGroups(groups) {
        $('#groups').text('');
        if (groups.length === 0) {
            $('.groups p').show();
        } else {
            $('.groups p').hide();
        }
        $('#groupnum').text(groups.length);
        for (let i = 0; i < groups.length; i++) {
            let $html = `<li id=${groups[i]._id} class="groupsign">
               <img src="${groups[i].img}">
               <span>${groups[i].name}</span>
               </li>`
               $('#groups').append($html);
        }
    }
    // 显示在线人员
    function displayUser(users) {
        $('#users').text(''); 
        if (!users.length) {
            $('.onlineuser p').show();
        } else {
            $('.onlineuser p').hide();
        }
        $('#num').text(users.length);
        for (let i = 0; i < users.length; i++) {
            let $html = `<li>
                <img src="${users[i].img}">
                <span>${users[i].name}</span>
            </li>`;
            $('#users').append($html);
        }
    }

    // 清空历史消息
    $('#clear').click(() => {
        $('#messages').text('');
        socket.emit('disconnect');
    })

    // 渲染表情
    init();
    function init() {
        for (let i = 0; i < 141; i++) {
            $('.emoji').append('<li id='+i+'><img src="/images/emoji/emoji ('+(i+1)+').png"></li>');
        }
    }

    // 显示表情
    $('#smile').click(() => {
        $('.selectBox').css('display', "block");
    });
    $('#smile').dblclick((event) => {
        $('.selectBox').css('display', 'none');
    });
    $('#m').click(() => {
        $('.selectBox').css('display', 'none');
    });
    // 用户点击发送表情
    $('.emoji li img').click((event) => {
        event = event || window.event;
        let src = event.target.src;
        console.log(src);
        // let emoji = src.replace(/\D*/g, '').substr(6, 8);
        let length = src.replace(/\D*/g, '').length;
        let emoji = src.replace(/\D*/g, '').substr(length-2,length);
        let old = $('#m').val();
        $('#m').val(old+'[emoji'+emoji+']');
        $('.selectBox').css('display', 'none');
    })
    // 用户发送抖动
    $('.edit #shake').click(function() {
        socket.emit('shake');
    })

    // 用户发送图片
    $('#file').change(function() {
        var file = this.files[0];  // 上传单张图片
        var reader = new FileReader();
  
        //文件读取出错的时候触发
        reader.onerror = function(){
            console.log('读取文件失败，请重试！'); 
        };
        // 读取成功后
        reader.onload = function() {
          var src = reader.result;  // 读取结果
          var img = '<img class="sendImg" src="'+src+'">';
          socket.emit('sendMsg', {  // 发送
            msg: img,
            color: color,
            type: 'img'
          }); 
        };
        reader.readAsDataURL(file); // 读取为64位
      });
      // 事件委托    
      $(document).on('click', '.groupsign', function() {
        let id = $(this).attr("id");
        $('#messages .system,.right,left').remove();
        // $('#messages .system').remove();
        // $('#messages .right').remove();
        // $('#messages .left').remove();
        console.log(id);
        socket.emit('entergroup', {
            groupid: id,
        })
        // 进入群组显示群组的详细信息
        socket.on('showgroup', (detail) => {
            console.log(detail);
            $('#grouptitle').text(detail.groupDetail.name)
            $('#grouptitle').css('padding-left','33%');
            // 获取该聊天室的聊天记录
            socket.emit('getmessages', {
                groupid: detail.groupDetail._id
            })
        })
        socket.on('showmessages', (data) => {
            // 显示最开始的时间戳
            console.log(data.data);
            $('#messages .system,.right,left').remove();
            let result = data.data;
            let datetime = moment(result[0].created).format('YYYY-MM-DD HH:MM:SS')
            $('#messages').append(`
              <p class="system"><span>历史消息</span><br /><span>${datetime}</span><br /></p>
            `)
            for (let i = 0; i < result.length; i++) {
                let side = (data.nickname === result[i].author.name) ? 'right' : 'left';
                if (result[i].type === 'img') {
                    $('#messages').append(`
                       <li class="${side}">
                          <img src="${result[i].author.img}">
                          <div>
                             <span>${result[i].author.name}</span>
                             <p style="padding: 0;">${result[i].content}</p>
                          </div>
                       </li>
                    `)
                } else if (result[i].type === 'text') {
                    let content = '';
                    let msg = result[i].content;
                    while(msg.indexOf('[') > -1 && msg.indexOf(']') > -1) {
                        let start = msg.indexOf('[');
                        let end = msg.indexOf(']');
                        content += '<span>'+msg.substr(0, start)+'</span>';
                        content += '<img src="/images/emoji/emoji%20('+msg.substr(start+6, end-start-6)+').png">';
                        msg = msg.substr(end+1, msg.length);
                    }
                    content += '<span>'+msg+'</span>';
                    $('#messages').append(`
                        <li class="${side}">
                           <img src="${result[i].author.img}">
                           <div>
                              <span>${result[i].author.name}</span>
                              <p style="color: #000000;">${content}</p>
                           </div>
                        </li>
                    `)
                }
            }
            $('#messages').scrollTop($('#messages')[0].scrollHeight);
            
        })
        socket.on('grouperror', () => {
            alert('进去群组失败！');
        })
        socket.on('nogroup', () => {
            alert('该聊天室不存在')
        })
    })
})
