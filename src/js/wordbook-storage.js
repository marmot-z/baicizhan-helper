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

    // 缓存相关常量
    const CACHE_KEY = 'wordbook-cache';
    const CACHE_EXPIRE_TIME = 5 * 60 * 1000; // 5分钟缓存过期

    // 缓存结构
    let cache = {
        words: [],
        timestamp: 0
    };

    WordbookStorage.loadAllWords = async function() {
        // 1. 检查缓存
        if (cache.words.length > 0 && 
            Date.now() - cache.timestamp < CACHE_EXPIRE_TIME) {
            console.log('返回缓存的单词数据:', cache.words.length);
            return cache.words;
        }

        // 1. 获取所有 storage keys
        const items = await chrome.storage.local.get(null);
        const wordbookKeys = Object.keys(items).filter(key => key.startsWith(KEY_PREFIX));
        
        // 2. 直接从 items 中提取数据，避免二次查询
        const allWords = wordbookKeys.reduce((acc, key) => {
            const words = items[key] || [];
            return acc.concat(words);
        }, []);
        
        // 3. 更新缓存
        cache.words = allWords;
        cache.timestamp = Date.now();
        console.log('更新缓存，单词数:', allWords.length);
        
        return allWords;
    };

    // 添加清除缓存的方法
    WordbookStorage.clearCache = function() {
        cache = {
            words: [],
            timestamp: 0
        };
        console.log('单词缓存已清除');
    };

    // 在数据变更时清除缓存
    const originalAdd = WordbookStorage.add;
    WordbookStorage.add = async function(...args) {
        const result = await originalAdd.apply(this, args);
        WordbookStorage.clearCache();
        return result;
    };

    const originalRemove = WordbookStorage.remove;
    WordbookStorage.remove = async function(...args) {
        const result = await originalRemove.apply(this, args);
        WordbookStorage.clearCache();
        return result;
    };

    const originalClear = WordbookStorage.clear;
    WordbookStorage.clear = function() {
        originalClear.call(this);
        WordbookStorage.clearCache();
    };

    global.wordbookStorageModule = {WordbookStorage};
}(this /* WorkerGlobalScope or Window */));