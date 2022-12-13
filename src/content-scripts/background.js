;(function() {
    'use strict';

    // 默认代理服务器
    const defaultProxyHost = 'http://43.142.135.24:8080';

    let proxyHost,   // 代理地址
        bookId,      // 选中的单词本
        accessToken; // 登录 token

    chrome.storage.local.get([
        'baicizhanHelper.proxyHost', 
        'baicizhanHelper.proxyPort',
        'baicizhanHelper.bookId',
        'baicizhanHelper.accessToken'
    ], (result) => {
        proxyHost = !result['baicizhanHelper.proxyHost'] ?
            defaultProxyHost :
            `http://${result['baicizhanHelper.proxyHost']}:${result['baicizhanHelper.proxyPort']}`;
        bookId = result['baicizhanHelper.bookId'];
        accessToken = result['baicizhanHelper.accessToken'];

        if (!accessToken) {
            console.warn("baicizhanHelper.accessToken is undefined");
        }

        if (!bookId) {
            console.warn("baicizhanHelper.bookId is undefined");
        }
    });

    // background.js 在插件加载或刷新后执行，
    // 所以需要监听 proxyHost、bookId、accessToken 值以更新
    chrome.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
            if (key == 'baicizhanHelper.accessToken') {                    
                accessToken = newValue;
            }

            switch (key) {
                case 'baicizhanHelper.proxyHost' : return proxyHost = proxyHost.replace(/http:\/\/.*?:(\d+)/, `http://${newValue}:$1`);
                case 'baicizhanHelper.proxyPort' : return proxyHost = proxyHost.replace(/http:\/\/(.*?):\d+/, `http://$1:${newValue}`);
                case 'baicizhanHelper.bookId' : return bookId = newValue;
                case 'baicizhanHelper.accessToken' : return accessToken = newValue;
                default: return;
            }
        }

        if (!accessToken) {
            console.warn("baicizhanHelper.accessToken is undefined");
        }

        if (!bookId) {
            console.warn("baicizhanHelper.bookId is undefined");
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch(request.action) {
            case 'getWordInfo':
                getWordInfo(request.word).then(sendResponse);
                break;
            case 'getStorageInfo':
                getStorageInfo(request.keys).then(sendResponse);
                break;
            case 'collectWord':
                collectWord(request.word).then(sendResponse);
                break;
            default:
                sendResponse(new Error('未知的请求类型'));
        }

        // 异步返回 sendResponse
        return true;
    });

    function getWordInfo(word) {
        return sendRequest({
            method: 'GET',
            url: `${proxyHost}/search/word/${word}`
        })
        .then(data => {
            if (typeof data === 'string') {
                return Promise.resolve(data);
            }

            let bestMatch = data.data[0];
            let topicId = bestMatch?.topic_id;

            return topicId ?
                sendRequest({
                    method: 'GET',
                    url: `${proxyHost}/word/${topicId}`
                }) :
                Promise.resolve(null);
        });
    }

    function getStorageInfo(keys) {
        return new Promise(resolve => 
            chrome.storage.local.get(keys, results => {
                return resolve(results);
            }));        
    }

    function collectWord(word) {
        if (typeof bookId === 'undefined') {        
            return Promise.resolve('Not selected');
        }

        return sendRequest({
            method: 'PUT',
            url: `${proxyHost}/book/${bookId}/word/${word}`
        });
    }

    function sendRequest(options) {
        if (!accessToken) {        
            return Promise.resolve('Unauthorized');
        }

        return fetch(options.url, {
            method: options.method,
            mode: 'cors',
            headers: {
                access_token: accessToken
            }
        })
        .then(resp => resp.json());
    }
}) ();