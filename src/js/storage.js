;(function(global) {
    'use strict';

    const namespace = 'baicizhan-helper';

    function get(arg) {
        return Array.isArray(arg) ? getMulit(arg) : getSingle(arg);
    }

    function getSingle(key) {
        let completeKey = `${namespace}.${key}`;

        return new Promise((resolve) => {
            chrome.storage.local.get([completeKey])
                .then(result => resolve(result[completeKey]));
        });
    }

    function getMulit(keys) {
        let completeKeys = keys.map(key => `${namespace}.${key}`);

        return chrome.storage.local.get(completeKeys)
                    .then(result => completeKeys.map(k => result[k]));
    }

    function set(key, value) {
        let completeKey = `${namespace}.${key}`;

        return chrome.storage.local.set({[completeKey]: value});
    }

    function remove(keys) {
        let completeKeys = keys.map(key => `${namespace}.${key}`);

        return chrome.storage.local.remove(completeKeys);
    }

    // alias
    const getStorageInfo = get;

    global.storageModule = {set, get, getStorageInfo, remove};
} (this  /* WorkerGlobalScope or Window */));