;(function(window) {
    'use strict';

    const defaultHost = '110.42.229.221';
    const defaultPort = 8080;

    function getVerifyCode(phoneNum) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/login/sendSmsVerifyCode/${phoneNum}`;

            return sendRequest({url, method: 'POST'});
        });
    }

    function login(phoneNum, verifyCode) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/login/${phoneNum}/${verifyCode}`;
        
            return sendRequest({url, method: 'POST'});
        });
    }

    function getUserInfo() {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/userInfo`;

            return sendRequest({
                url, 
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getBooks() {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/books`;

            return sendRequest({
                url, 
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function loadRequestOptions() {
        const keys = ['host', 'port', 'accessToken'];

        return Promise.all(keys.map(k => storageModule.get(k)))
                    .then(([host, port, accessToken]) => {
                        return [host || defaultHost, port || defaultPort, accessToken];
                    });
    }

    function sendRequest(options = {}) {
        return new Promise((resolve, reject) => {
            return fetch(options.url, {
                        method: options.method,
                        mode: 'cors',
                        headers: options.headers
                    })
                    .then(response => response.json())
                    .then(responseJson => responseJson.code == 200 ? 
                            resolve(responseJson.data) : 
                            reject(new Error(responseJson.message))
                    )
                    .catch(e => reject(e));
        });
    }

    window.apiModule = {
        getVerifyCode, login, getUserInfo, 
        getBooks, defaultHost, defaultPort
    };
} (this));