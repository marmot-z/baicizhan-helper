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
            if (c === ' ') continue;

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
        let collected = await WordbookStorage.contains(topicId);
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

    async function cancelCollectWord(topicId) {
        try {
            // 1. 直接从本地存储获取包含该单词的单词本
            const allWords = await WordbookStorage.loadAllWords();
            const bookIds = new Set();
            allWords.forEach(word => {
                if(word.topic_id == topicId) {
                    bookIds.add(word.book_id);
                }
            });

            if(bookIds.size === 0) {
                return true; // 单词未被收藏，直接返回
            }

            // 2. 获取请求配置
            const [host, port, accessToken] = await loadRequestOptions();

            // 3. 从所有包含该单词的单词本中删除
            const promises = Array.from(bookIds).map(async (bookId) => {
                // 先从服务器删除
                const url = `http://${host}:${port}/book/${bookId}/word/${topicId}`;
                await sendRequest({
                    url,
                    method: 'DELETE',
                    headers: {'access_token': accessToken}
                });

                // 再从本地存储删除 - 本地存储会自动过滤掉这个单词
                await WordbookStorage.remove(bookId, topicId);
            });

            await Promise.all(promises);
            return true;
        } catch(error) {
            console.error('Cancel collect word failed:', error);
            throw error;
        }
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

    function getSelectBookPlanInfo() {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/selectBookPlanInfo`;

            return sendRequest({
                url,
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getAllBookInfo() {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/booksInfo`;

            return sendRequest({
                url,
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getRoadmaps(bookId) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/roadmap?bookId=${bookId}`;

            return sendRequest({
                url,
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function getLearnedWords(bookId) {
        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/learnedWords?bookId=${bookId}`;

            return sendRequest({
                url,
                method: 'GET',
                headers: {'access_token': accessToken}
            });
        });
    }

    function updateDoneData(words) {
        let records = words.map(w => {
            return  {
                word_topic_id: w.topicId,
                done_times: w.doneTimes,
                wrong_times: w.wrongTimes,
            };
        })

        return loadRequestOptions().then(([host, port, accessToken]) => {
            const url = `http://${host}:${port}/updateDoneData`;

            return sendRequest({
                url,
                method: 'POST',
                headers: {
                    'access_token': accessToken,
                    'content-type': 'application/json',
                },
                body: {
                    doneRecords: records,
                    wordLevelId: words[0]?.wordLevelId
                }
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
                    .then(responseJson => responseJson.code === 200 ?
                            resolve(responseJson.data) : 
                            reject(new Error(responseJson.message))
                    )
                    .catch(e => reject(e));
        });
    }

    async function syncWordbook() {
        try {
            // 获取当前单词本ID
            const bookId = await storageModule.get('bookId') || 0;
            
            // 从服务器获取最新的单词列表
            const [host, port, accessToken] = await loadRequestOptions();
            const url = `http://${host}:${port}/book/${bookId}/words`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'access_token': accessToken,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('同步单词本失败');
            }

            const responseJson = await response.json();
            if (responseJson.code !== 200) {
                throw new Error(responseJson.message || '获取单词列表失败');
            }

            const data = responseJson.data;
            if (!data || !Array.isArray(data)) {
                throw new Error('获取单词列表失败');
            }

            // 更新本地存储
            await wordbookStorageModule.WordbookStorage.save(bookId, data);
            
            return true;
        } catch (error) {
            console.error('同步单词本出错:', error);
            throw error;
        }
    }

    // 获取用户所有单词本
    async function getAllUserBooks() {
        const [host, port, accessToken] = await loadRequestOptions();
        const url = `http://${host}:${port}/books`;
        
        const response = await sendRequest({
            url,
            method: 'GET',
            headers: {'access_token': accessToken}
        });
        
        return response.user_books || [];
    }

    async function translate(text) {
        try {
            const myAppId = "37E13AC276BAB67F701AFE3EB1B5AC14EE66A049";
            const from = isEnglishPhrase(text) ? "en" : "zh";
            const to = isEnglishPhrase(text) ? "zh" : "en";
            const url = `http://api.microsofttranslator.com/V2/Ajax.svc/Translate?appId=${myAppId}&from=${from}&to=${to}&text=${encodeURIComponent(text)}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'text/plain',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('翻译请求失败');
            }

            const result = await response.text();
            return {translatedText: result.replaceAll('"', '')};
        } catch (error) {
            console.error('Microsoft translate error:', error);
            throw new Error('翻译失败：' + error.message);
        }
    }

    const exports = {
        getVerifyCode, loginWithPhone, getUserInfo, 
        getBooks, defaultHost, defaultPort, loginWithEmail,
        searchWord, getWordDetail, collectWord, translate,
        cancelCollectWord, getBookWords, getWordInfo, 
        getCalendarDailyInfo, getLatestVersion, getSelectBookPlanInfo,
        getAllBookInfo, getRoadmaps, getLearnedWords, updateDoneData,
        syncWordbook
    };

    global.apiModule = exports;
} (this /* WorkerGlobalScope or Window */));