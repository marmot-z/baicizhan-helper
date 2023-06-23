;(function(actions) {
    'use strict';

    function handleMessage(request, sender, sendResponse) {
        for (let [fnName, fn] of Object.entries(actions)) {
            if (fnName == request.action) {
                fn.call(null, request.args)
                    .then(r => sendResponse(r))
                    // 由于 sendResponse 不能返回结果类型，所以约定 [Error]: 代表请求报错
                    .catch(e => sendResponse(`[Error]:${e.message}`));

                break;
            }
        }

        // async execute sendResponse
        return true;
    }

    chrome.runtime.onMessage.addListener(handleMessage);
} (
    (function() {
        'use strict';

        const defaultHost = '110.42.229.221';
        const defaultPort = 8080;
        const namespace = 'baicizhan-helper';

        function getWordInfo(word) {
            return loadRequestOptions().then(([host, port, accessToken]) => {
                let url = `http://${host}:${port}/search/word/${word}`;

                return sendRequest({
                        url, 
                        method: 'GET',
                        headers: {'access_token': accessToken}
                    })
                    .then(data => {
                        let bestMatch = data[0];
                        let topicId = bestMatch?.topic_id;
                        url = `http://${host}:${port}/word/${topicId}`;

                        if (!topicId) return Promise.resolve(null);                        

                        return sendRequest({
                            url, 
                            method: 'GET',
                            headers: {'access_token': accessToken}
                        });
                    });
            });
        }

        function collectWord(word) {
            return Promise.all([
                loadRequestOptions(),
                getWorkbookId()
            ]).then(([[host, port, accessToken], bookId]) => {
                const url = `http://${host}:${port}/book/${bookId}/word/${word}`;

                return sendRequest({
                    url,
                    method: 'PUT',
                    headers: {'access_token': accessToken}
                });
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
                        .then(responseJson => {
                            return responseJson.code == 200 ? 
                                resolve(responseJson.data) : 
                                reject(new Error(responseJson.message));
                        })
                        .catch(e => reject(e));
            });
        }

        function loadRequestOptions() {
            const keys = ['host', 'port', 'accessToken'].map(k => `${namespace}.${k}`);

            return chrome.storage.local.get(keys)
                .then(result => {
                    return [
                        result[`${namespace}.host`] || defaultHost,
                        result[`${namespace}.port`] || defaultPort,
                        result[`${namespace}.accessToken`],
                    ];
                })
        }

        function getWorkbookId() {
            return getStorageInfo(['bookId']).then(([bookId]) => bookId || 0);
        }

        function getStorageInfo(keys) {
            let completeKeys = keys.map(key => `${namespace}.${key}`);

            return chrome.storage.local.get(completeKeys)
                        .then(result => completeKeys.map(k => result[k]));
        }

        return {getWordInfo, collectWord, getStorageInfo};
    } ())
));