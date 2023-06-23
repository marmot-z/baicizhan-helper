;(function(window, $) {
    'use strict';

    const {showLoginModel} = window.loginModule;

    function init() {
        loginModule.init();
        settingModule.init();
        
        // 获取当前 accessToken，如果没有登录则跳转登录
        storageModule.get('accessToken')
            .then(accessToken => !accessToken && showLoginModel());
    }

    window.onload = init;
} (this, jQuery));