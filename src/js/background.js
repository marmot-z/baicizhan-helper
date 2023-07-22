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
    function(global) {
        'use strict';

        importScripts('storage.js', 'wordbook-storage.js', 'api.js');

        return global.apiModule;
    } (this)
));