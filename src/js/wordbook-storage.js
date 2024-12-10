; (function (global) {
    'use strict';

    /**
     * 静态方法实现，则每次读取全部的 storage 内容（并回写）
     * 缺点：数据写入写出频繁，效率低
     * 优点：开发简单，无数据不一致性问题
     * 
     * 对象实现，需要考虑对象的生命周期，以及数据一致性问题
     * 缺点：开发难度稍大，存在数据不一致的问题
     * 优点：效率有一定提升
     * 
     * 当前不考虑效率问题，使用静态方法实现
     */

    const KEY_PREFIX = 'baicizhan-helper.wordbook';

    function WordbookStorage() {}

    WordbookStorage.load = function (bookId) {
        return loadWordbook(bookId);
    };

    function loadWordbook(bookId) {
        let key = `${KEY_PREFIX}${bookId}`;

        return new Promise((resolve) => {
            chrome.storage.local.get([key])
                .then(result => resolve(result[key] || []));
        });
    }

    WordbookStorage.save = function (bookId, data) {
        return saveWordbook(bookId, data);
    };

    function saveWordbook(bookId, data) {
        let key = `${KEY_PREFIX}${bookId}`;

        return chrome.storage.local.set({ [key]: data });
    }

    WordbookStorage.add = function (bookId, word) {
        if (!word) return;

        word.created_at = new Date().getTime();

        return new Promise((resolve) => {
            WordbookStorage.load(bookId)
                .then(wordbook => {
                    let topicIdSet = new Set(wordbook.map(word => word.topic_id));

                    if (!topicIdSet.has(word.topic_id)) {
                        wordbook.push(word);
                        WordbookStorage.save(bookId, wordbook);
                    }

                    resolve(true);
                });
        });
    };

    WordbookStorage.remove = function (bookId, topicId) {
        if (!topicId) return;

        return new Promise((resolve) => {
            WordbookStorage.load(bookId)
                .then(wordbook => {
                    let filteredWordbook = wordbook.filter(word => word.topic_id != topicId);

                    WordbookStorage.save(bookId, filteredWordbook);
                    resolve(true);
                });
        });
    };

    WordbookStorage.contains = function (bookId, topicId) {
        return new Promise((resolve) => {
            WordbookStorage.load(bookId)
                .then(wordbook => {
                    let topicIdSet = new Set(wordbook.map(word => word.topic_id));

                    resolve(topicIdSet.has(topicId));
                });
        });
    };

    WordbookStorage.clear = function () {
        chrome.storage.local.get(null, (items) => {
            let allKeys = Object.keys(items);

            for (let key of allKeys) {
                if (key.startsWith(KEY_PREFIX)) {
                    chrome.storage.local.remove(key);
                }
            }
        });
    };

    WordbookStorage.loadAllWords = async function() {
        // 1. 先获取所有 keys
        const keys = await chrome.storage.local.get(null).then(items => 
            Object.keys(items).filter(key => key.startsWith(KEY_PREFIX))
        );
        
        // 2. 并行加载所有单词本
        const wordbooks = await Promise.all(
            keys.map(key => chrome.storage.local.get(key))
        );
        
        // 3. 使用 Map 合并去重
        const uniqueWords = new Map();
        wordbooks.forEach(item => {
            const words = Object.values(item)[0] || [];
            words.forEach(word => {
                uniqueWords.set(word.topic_id, word);
            });
        });
        
        return Array.from(uniqueWords.values());
    };

    global.wordbookStorageModule = {WordbookStorage};
}(this /* WorkerGlobalScope or Window */));