;(function(window) {
    'use strict';

    var baicizhanHelper = {
        // 代理服务器主机地址
        'PROXY_HOST': 'http://43.142.135.24:8080',
    };

    function initial() {
        loadStorageInfo()
            .then(() => {
                // 没有设备 id，则随机生成设备 id
                if (!baicizhanHelper.deviceId) {
                    storageDeviceId(generateDeviceId());
                }

                // 没有登录 token，则跳转登录页面
                if (!baicizhanHelper.accessToken || baicizhanHelper.accessToken.trim() == '') {
                    toggle2LoginView();
                } else {
                    toggle2SettingView();
                }
            });

        // TODO 增加全局的 unauthorized 监听事件
    }   
    
    function loadStorageInfo() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(
                [
                    'baicizhanHelper.deviceId', 
                    'baicizhanHelper.accessToken', 
                    'baicizhanHelper.selectedBookId'
                ],
                function(result) {
                    baicizhanHelper.deviceId = result['baicizhanHelper.deviceId'];
                    baicizhanHelper.accessToken = result['baicizhanHelper.accessToken'];
                    baicizhanHelper.selectedBookId = result['baicizhanHelper.selectedBookId'];

                    resolve();
                }
            )
        });
    }

    function generateDeviceId() {
        return randomeString(8) + "-" +
                randomeString(4) + '-' + 
                randomNumber(4) + '-' +
                randomeString(4) + '-' +
                randomeString(12);
    }

    function randomeString(len) {
        return Math.random().toString(36).slice(2, len + 2).toUpperCase();
    }

    function randomNumber(len) {
        let arr = [];

        while (len--) {
            arr.push(Math.floor(Math.random() * 10));
        }

        return arr.join('');
    }

    function storageDeviceId(deviceId) {
        chrome.storage.local.set({'baicizhanHelper.deviceId': deviceId});
        baicizhanHelper.deviceId = deviceId;
    }

    function toggle2SettingView() {
        $('#settingView').removeClass('hidden').addClass('visible');
        $('#loginView').removeClass('visible').addClass('hidden');
        $('body').trigger('toggleSettingView');
    }

    function toggle2LoginView() {
        $('#loginView').removeClass('hidden').addClass('visible');
        $('#settingView').removeClass('visible').addClass('hidden');
        $('body').trigger('toggleLoginView');
    }

    baicizhanHelper.toggle2SettingView = toggle2SettingView;
    baicizhanHelper.toggle2LoginView = toggle2LoginView;

    window.onload = initial;
    window.baicizhanHelper = baicizhanHelper;
}) (this);