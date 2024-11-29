;(function(actions) {
    'use strict';

    function handleMessage(request, sender, sendResponse) {
        try {
            // 处理 AnkiConnect 请求
            if (request.type === 'ankiConnect') {
                fetch('http://127.0.0.1:8765', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request.params)
                })
                .then(response => response.json())
                .then(result => {
                    sendResponse({ success: true, data: result });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                return true;
            }

            // 处理其他请求
            for (let [fnName, fn] of Object.entries(actions)) {
                if (fnName == request.action) {
                    fn.call(null, request.args)
                        .then(r => sendResponse(r))
                        .catch(e => sendResponse(`[Error]:${e.message}`));
                    break;
                }
            }
        } catch (error) {
            console.error('Error in handleMessage:', error);
            sendResponse({ success: false, error: error.message });
        }

        return true;
    }

    chrome.runtime.onMessage.addListener(handleMessage);
} (
    function(global) {
        'use strict';

        importScripts('storage.js', 'wordbook-storage.js', 'api.js');        

        return {
            getStorageInfo: global.storageModule.getStorageInfo,
            getWordInfo: global.apiModule.getWordInfo,
            translate: global.apiModule.translate,
            cancelCollectWord: global.apiModule.cancelCollectWord,
            collectWord: global.apiModule.collectWord
        };
    } (this)
));