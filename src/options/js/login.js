;(function(window, $) {
    'use strict';

    const {getVerifyCode, loginWithPhone, loginWithEmail, getUserInfo} = window.apiModule;
    const $loginModel = $('#loginModel');
    // 登录模式：phone, email
    let loginMode = 'phone';

    function initLoginModalEvent() {
        const $sendVerifyButton = $('#sendVerifyButton');
        const $loginButton = $('#loginButton');

        $sendVerifyButton.on('click', () => {
            let phoneNum = $('#phoneNumInput').val();

            if (!phoneNum) {
                return alert('手机号码不能为空');
            }

            getVerifyCode(phoneNum).then(() => {
                    alert('验证码发送成功');
                    $sendVerifyButton.off('click').prop('disabled', true);
                })
                .catch(e => {
                    console.error(`向 ${phoneNum} 发送验证码失败`, e);
                    alert('发送验证码失败，请稍候再试');
                });
        });

        $loginButton.on('click', () => {
            loginMode == 'phone' ? loginByPhone() : loginByEmail();
        });

        $('#emailLoginLink').on('click', toggle2emailLoginForm);
        $('#phoneLoginLink').on('click', toggle2phoneLoginForm);
        $('#wechatLoginLink, #qqLoginLink').on('click', () => alert('暂不支持'));
    };

    function loginByPhone() {
        let phoneNum = $('#phoneNumInput').val();
        let verifyCode = $('#verifyCodeInput').val();

        if (!phoneNum || !verifyCode) {
            return alert('手机号码或验证码不能为空');
        }

        loginWithPhone(phoneNum, verifyCode)
            .then(loginSuccessful)            
            .catch(loginFailure);
    }

    function loginSuccessful(data) {
        // ccess_token 写入 storage
        storageModule.set('accessToken', data.access_token);
        // 禁止点击
        $('#loginButton').off('click').prop('disabled', true);
        // 登录模态框隐藏
        $loginModel.modal('hide');
        // 显示用户信息，支持退出
        loadUserInfo();
        alert('登录成功');        
    }

    function loginFailure(e) {
        console.error(`登录失败`, e);
        alert('登录失败，请稍候再试');
    }

    function loginByEmail() {
        let email = $('#emailInput').val();
        let password = $('#passwordInput').val();

        if (!email || !password) {
            return alert('邮箱或密码不能为空');
        }

        loginWithEmail(email, password)
            .then(loginSuccessful)            
            .catch(loginFailure);
    }

    function toggle2emailLoginForm(e) {
        e && e.preventDefault();

        $('#phoneLoginForm').css('display', 'none');
        $('#emailLoginForm').css('display', 'block');
        $('#sendVerifyButton').css('display', 'none');
        $('#loginModelLabel').html('邮箱登录');
        loginMode = 'email';
    }

    function toggle2phoneLoginForm(e) {
        e && e.preventDefault();

        $('#phoneLoginForm').css('display', 'block');
        $('#emailLoginForm').css('display', 'none');
        $('#sendVerifyButton').css('display', 'block');
        $('#loginModelLabel').html('短信登录');
        loginMode = 'phone';
    }

    function showLoginModel() {
        initLoginModalEvent();
        toggle2phoneLoginForm();
        $loginModel.modal('show');        
    };

    function loadUserInfo() {
        getUserInfo().then(data => {
            let nickname = data.length ? data[0].nickname : 'guest';
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