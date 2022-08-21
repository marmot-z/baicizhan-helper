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
                        return handleUnauthorized(result, reject);
                    }

                    return handleServerError(result, reject);
                },
                fail: function(err) {
                    return handleServerError(err, reject);
                }
            });
        });
    }

    function handleUnauthorized(result, reject) {
        $.growl({
            title: '登录',
            message: '尚未登录或登录失效',
            size: 'medium',
            style: 'error'
        });

        baicizhanHelper.toggle2LoginView();

        return reject(result);
    }

    function handleServerError(result, reject) {
        $.growl({
            title: '查询',
            message: '服务异常',
            size: 'medium',
            style: 'error'
        });

        return reject(result);
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
                        return handleUnauthorized(result, reject);
                    }

                    return handleServerError(result, reject);
                },
                fail: function(err) {
                    return handleServerError(err, reject);
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