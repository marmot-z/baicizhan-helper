;(function(window, $) {
    'use strict';

    const {getVerifyCode, login, getUserInfo} = window.apiModule;
    const $loginModel = $('#loginModel');

    function initLoginModalEvent() {
        const $sendVerifyButton = $('#sendVerifyButton');
        const $loginButton = $('#loginButton');

        // 发送验证码
        // 恢复可点击状态
        $sendVerifyButton.on('click', () => {
            // 未填写手机号码则提示
            let phoneNum = $('#phoneNum').val();

            if (!phoneNum) {
                return alert('手机号码不能为空');
            }

            // 发起发送验证码请求
            getVerifyCode(phoneNum).then(() => {
                    alert('验证码发送成功');
                    $sendVerifyButton.off('click').prop('disabled', true);
                })
                .catch(e => {
                    console.error(`向 ${phoneNum} 发送验证码失败`, e);
                    alert('发送验证码失败，请稍候再试');
                });
        });

        // 登录
        // 恢复可点击状态
        $loginButton.on('click', () => {
            // 未填写手机号码和验证码则提示
            let phoneNum = $('#phoneNum').val();
            let verifyCode = $('#verifyCode').val();

            if (!phoneNum || !verifyCode) {
                return alert('手机号码或验证码不能为空');
            }

            // 发起登录请求
            login(phoneNum, verifyCode).then(data => {                                        
                    // ccess_token 写入 storage
                    storageModule.set('accessToken', data.access_token);
                    // 禁止点击
                    $loginButton.off('click').prop('disabled', true);
                    // 登录模态框隐藏
                    $loginModel.modal('hide');
                    // 显示用户信息，支持退出
                    loadUserInfo();
                    alert('登录成功');
                })            
                .catch(e => {
                    console.error(`${phoneNum}(${verifyCode}) 登录失败`, e);
                    alert('登录失败，请稍候再试');
                })
        });
    };

    function showLoginModel() {
        initLoginModalEvent();
        $loginModel.modal('show');        
    };

    function loadUserInfo() {
        getUserInfo().then(data => {
            let nickname = data.length ? data[0].nickname : '百词斩用户';
            $('#username').html(nickname);
        })
        .catch(e => console.error(`获取用户信息失败`, e));
    }

    function logout() {
        storageModule.remove(['accessToken', 'bookId']);
        showLoginModel();
    }

    function init() {
        loadUserInfo();

        $('#exit').on('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    window.loginModule = {init, showLoginModel};
} (this, jQuery));