;(function() {
    'use strict';

    var host = 'http://43.142.135.24:8080';
    var baicizhanHelper = {};

    /**
     * 获取单词详情信息
     * @param {String} word 单词
     * @returns 
     */
    function getWordInfo(word) {
        return sendRequest('GET', host + '/search/word/' + word)
                .then(function(data) {
                    var bestMatchWord = data.data[0];
                    var wordTopicId = bestMatchWord.topic_id;

                    return sendRequest('GET', host + '/word/' + wordTopicId);
                });
    }

    function addWord(bookId, word) {
        // 尚未选中单词本，则返回 400 代表参数错误
        if (typeof bookId != 'number') {
            return Promise.resolve({
                code: 400,
                message: '未选择单词本'
            });
        }

        return sendRequest('PUT', host + '/book/' + bookId+ '/word/' + word);
    }

    function sendRequest(method, url) {
        // v3 版本废弃了 XMLHttpRequest，只能使用 fetch
        return fetch(url, {
            method: method,
            mode: 'cors',
            headers: {
                'access_token': baicizhanHelper.accessToken,
                'device_id': baicizhanHelper.deviceId
            }
        })
        .then(function(response) {
            return response.json();
        });
    }

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
        }
    );

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.action) {
            case 'get':
                getWordInfo(request.word)
                    .then(sendResponse);
                break;

            case 'addWord': 
                addWord(baicizhanHelper.selectedBookId, request.word)
                    .then(sendResponse);
                break;
        }

        // async use sendResponse
        return true;
    });
}) ();