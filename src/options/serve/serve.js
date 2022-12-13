const proxyHost = 'http://localhost:8080';

/**
 * 获取验证码
 * @param {String} phoneNum 手机号码
 * @returns 
 */
function getVerifyCode(phoneNum) {
    const url = `${proxyHost}/login/sendSmsVerifyCode/${phoneNum}`;

    return sendRequest({url, method: 'POST'});
}

/**
 * 登录
 * @param {String} phoneNum 手机号码
 * @param {String} verifyCode 验证码
 * @returns 
 */
function login(phoneNum, verifyCode) {
    const url = `${proxyHost}/login/${phoneNum}/${verifyCode}`;

    return sendRequest({url, method: 'POST'});
}

/**
 * 获取用户信息
 */
function getUserInfo() {
    const url = `${proxyHost}/userInfo`;

    return sendAuthorizedRequest({url, method: 'GET'});
}

/**
 * 获取用户单词本
 * @returns 
 */
function getBooks() {
    const url = `${proxyHost}/books`;

    return sendAuthorizedRequest({url, method: 'GET'});
}

/**
 * 发送 http 请求
 * @param {Object} options 请求参数
 * @returns 
 */
function sendRequest(options = {}) {
    return fetch(options.url, {
        method: options.method,
        mode: 'cors',
        headers: options.headers
    })
    .then(response => response.json());
}

function sendAuthorizedRequest(options = {}) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['baicizhanHelper.accessToken'], result => {
            let accessToken = result['baicizhanHelper.accessToken'];

            if (!accessToken) {
                return reject(new Error('未登录'));
            }

            if (!options.headers) {
                options.headers = {};
            }

            options.headers['access_token'] = accessToken;

            return sendRequest(options).then(resolve);
        });
    });
}

export default {
    getVerifyCode,
    login,
    getUserInfo,
    getBooks
};