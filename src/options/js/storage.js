;(function(window) {
    'use strict';

    const namespace = 'baicizhan-helper';

    function get(key) {
        let completeKey = `${namespace}.${key}`;

        return new Promise((resolve) => {
            chrome.storage.local.get([completeKey])
                .then(result => resolve(result[completeKey]));
        });
    }

    function set(key, value) {
        let completeKey = `${namespace}.${key}`;

        return chrome.storage.local.set({[completeKey]: value});
    }

    function remove(keys) {
        let completeKeys = keys.map(key => `${namespace}.${key}`);

        return chrome.storage.local.remove(completeKeys);
    }

    window.storageModule = {set, get, remove};
} (this));