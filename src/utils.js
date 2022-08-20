;(function(window) {
    'use strict';

    function ajaxGet(options) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: options.url,
                method: 'get',
                headers: {
                    'device_id': baicizhanHelper.deviceId,
                    'access_token': baicizhanHelper.accessToken,
                },
                success: function(result) {
                    if (result.code == 200) {
                        return resolve(result.data);
                    }

                    if (result.code == 401) {
                        // 弹窗提示未登录
                        // 触发 unauthorized 事件，跳转登录页面
                        // reject 返回错误信息
                    }

                    // 弹窗提示服务异常
                    // reject 返回错误信息
                },
                fail: function() {
                    // 弹窗提示服务异常
                    // reject 返回错误信息
                }
            });
        });
    }

    function ajaxPost(options) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: options.url,
                method: 'post',
                headers: {
                    'device_id': window.baicizhanHelper.deviceId,
                    'access_token': window.baicizhanHelper.accessToken
                },
                data: options.data,
                success: function(result) {
                    if (result.code == 200) {
                        return resolve(result.data);
                    }

                    if (result.code == 401) {
                        // 弹窗提示未登录
                        // 触发 unauthorized 事件，跳转登录页面
                        // reject 返回错误信息
                    }

                    // 弹窗提示服务异常
                    // reject 返回错误信息
                },
                fail: function() {
                    // 弹窗提示服务异常
                    // reject 返回错误信息
                }
            });
        });
    }

    if (!window.baicizhanHelper.Utils) {
        window.baicizhanHelper.Utils = {};
    } 

    window.baicizhanHelper.Utils.ajaxGet = ajaxGet;
    window.baicizhanHelper.Utils.ajaxPost = ajaxPost;
}) (this);