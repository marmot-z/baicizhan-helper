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

    function loginWithPhone(phoneNum, verifyCode) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/login/${phoneNum}/${verifyCode}`;
        
            return sendRequest({url, method: 'POST'});
        });
    }

    function loginWithEmail(email, password) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/loginWithEmail?email=${encodeURIComponent(email)}&password=${password}`;
        
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

    function searchWord(word) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/search/word/${word}`;

            return sendRequest({
                url, 
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getWordDetail(topicId) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/word/${topicId}`;                      

            return sendRequest({
                url, 
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function collectWord(topicId) {
        return Promise.all([
            loadRequestOptions(),
            getWordbookId()
        ]).then(([[host, port, accessToken], bookId]) => {
            const url = `http://${host}:${port}/book/${bookId}/word/${topicId}`;

            return sendRequest({
                url,
                method: 'PUT',
                headers: {'access_token': accessToken}
            });
        });
    }

    function cancelCollectWord(topicId) {
        return Promise.all([
            loadRequestOptions(),
            getWordbookId()
        ]).then(([[host, port, accessToken], bookId]) => {
            const url = `http://${host}:${port}/book/${bookId}/word/${topicId}`;

            return sendRequest({
                url,
                method: 'DELETE',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getBookWords(bookId) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/book/${bookId}/words`;

            return sendRequest({
                url,
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getWordbookId() {
        return storageModule.get('bookId').then(bookId => bookId || 0);
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
        getVerifyCode, loginWithPhone, getUserInfo, 
        getBooks, defaultHost, defaultPort, loginWithEmail,
        searchWord, getWordDetail, collectWord,
        cancelCollectWord, getBookWords
    };
} (this));