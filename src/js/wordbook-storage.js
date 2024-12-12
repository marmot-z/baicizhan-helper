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

    WordbookStorage.remove = async function (bookId, topicId) {
        if (!topicId) return;

        try {
            // 1. 检查单词本中是否存在该单词
            const allWords = await this.loadAllWords();
            const wordsToDelete = allWords.filter(word => 
                word.topic_id == topicId && word.book_id == bookId
            );
            
            if (wordsToDelete.length > 0) {
                // 2. 加载并过滤单词本
                const wordbook = await WordbookStorage.load(bookId);
                const filteredWordbook = wordbook.filter(word => word.topic_id != topicId);
                
                // 3. 保存过滤后的单词本
                await WordbookStorage.save(bookId, filteredWordbook);
                
                // 4. 验证删除结果
                const verifyWordbook = await WordbookStorage.load(bookId);
                if (verifyWordbook.some(word => word.topic_id == topicId)) {
                    throw new Error('删除单词失败：单词仍然存在');
                }
            }
            
            return true;
        } catch (error) {
            console.error('[Storage] Remove word from storage failed:', error);
            throw error;
        }
    };

    WordbookStorage.contains = async function (topicId) {
        // 获取所有单词
        const allWords = await this.loadAllWords();
        // 检查是否在任意单词本中存在
        return allWords.some(word => word.topic_id == topicId);
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
        
        // 3. 保留所有单词本中的单词（不去重）
        const allWords = [];
        wordbooks.forEach(item => {
            const [key, words] = Object.entries(item)[0];
            if (words && Array.isArray(words)) {
                const bookId = key.replace(KEY_PREFIX, '');
                words.forEach(word => {
                    if (word.book_id != bookId) {
                        word.book_id = bookId; // 确保 book_id 正确
                    }
                    allWords.push(word);
                });
            }
        });
        
        return allWords;
    };

    global.wordbookStorageModule = {WordbookStorage};
}(this /* WorkerGlobalScope or Window */));