;(function(global) {
    'use strict';

    const defaultHost = '110.42.229.221';
    const defaultPort = 8080;
    const {storageModule, wordbookStorageModule} = global;
    const {WordbookStorage} = wordbookStorageModule;

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

    function getWordInfo(word) {
        return searchWord(word).then(data => {
            let bestMatch = data[0];
            let topicId = bestMatch?.topic_id;

            return topicId ?
                    getWordDetail(topicId) :
                    Promise.resolve(null);
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

    function translate(phrase) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/translate`;

            return fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'access_token': accessToken,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    q: phrase,
                    source: "auto",
                    target: isEnglishPhrase(phrase) ? 'zh' : 'en',
                    format: 'text',
                }),
            })
            .then(response => response.json())
            .catch(e => reject(e));
        });
    }

    function isEnglishPhrase(phrase) {
        let len = 0, characterSize = 0;

        for (let c of Array.from(phrase)) {
            if (c == ' ') continue;

            len++;

            if (c >= 'A' && c <= 'z') characterSize++;
        }

        return characterSize / len > 0.7;
    }

    function getWordDetail(topicId, withDict = true, withMedia = false, withSimilarWords = false) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/word/${topicId}?withDict=${withDict}&withMedia=${withMedia}&withSimilarWords=${withSimilarWords}`;                      

            return sendRequest({
                url, 
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        })
        .then(fillCollectedField);
    }

    async function fillCollectedField(data) {
        let topicId = data.dict.word_basic_info.topic_id;
        let bookId = await getWordbookId();        
        let collected = await WordbookStorage.contains(bookId, topicId);

        data.dict.word_basic_info.__collected__ = collected;

        return data;
    }

    function collectWord(word) {        
        let topicId = word.word_basic_info.topic_id;        

        return Promise.all([
            loadRequestOptions(),
            getWordbookId()
        ])
        .then(([[host, port, accessToken], bookId]) => {
            const url = `http://${host}:${port}/book/${bookId}/word/${topicId}`;

            return sendRequest({
                url,
                method: 'PUT',
                headers: {'access_token': accessToken}
            });
        })
        .then(async (data) => addWord(word, data));
    }

    async function addWord(word, data) {
        let wordInfo = word.word_basic_info;
        let chineseMeans = word.chn_means.reduce((prev, curr) => {
            prev[curr.mean_type] = prev[curr.mean_type] || [];
            prev[curr.mean_type].push(curr.mean);

            return prev;
        }, Object.create(null));
        let meanString = Object.entries(chineseMeans)
            .map(([k, v]) => `${k} ${v.join('；')}`)
            .join('； ');
        let bookId = await getWordbookId();

        WordbookStorage.add(bookId, {
            'audio_uk': wordInfo.accent_uk_audio_uri,
            'audio_us': wordInfo.accent_usa_audio_uri,
            'book_id': bookId,
            'mean': meanString,
            'setAudio_uk': true,
            'setAudio_us': true,
            'setBook_id': true,
            'setCreated_at': true,
            'setMean': true,
            'setTopic_id': true,
            'setWord': true,
            'topic_id': wordInfo.topic_id,
            'word': wordInfo.word,
        });

        return data;
    }

    function cancelCollectWord(topicId) {
        return Promise.all([
            loadRequestOptions(),
            getWordbookId()
        ])
        .then(([[host, port, accessToken], bookId]) => {
            const url = `http://${host}:${port}/book/${bookId}/word/${topicId}`;

            return sendRequest({
                url,
                method: 'DELETE',
                headers: {'access_token': accessToken}
            });
        })
        .then(async (data) => removeWord(data, topicId));
    }

    async function removeWord(data, topicId) {
        WordbookStorage.remove(await getWordbookId(), topicId);

        return data;
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

    function getCalendarDailyInfo(date) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/calendarDailyInfo?date=${date}&pageOffset=0&pageSize=200`;

            return sendRequest({
                url,
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getLatestVersion() {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/latestVersion`;

            return sendRequest({
                url,
                method: 'GET'
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
                        headers: options.headers,
                        body: options.body ? JSON.stringify(options.body) : undefined
                    })
                    .then(response => response.json())
                    .then(responseJson => responseJson.code == 200 ? 
                            resolve(responseJson.data) : 
                            reject(new Error(responseJson.message))
                    )
                    .catch(e => reject(e));
        });
    }

    const exports = {
        getVerifyCode, loginWithPhone, getUserInfo, 
        getBooks, defaultHost, defaultPort, loginWithEmail,
        searchWord, getWordDetail, collectWord, translate,
        cancelCollectWord, getBookWords, getWordInfo, 
        getCalendarDailyInfo, getLatestVersion
    };

    global.apiModule = exports;
} (this /* WorkerGlobalScope or Window */));