;(function(window) {
    'use strict';

    function WordbookStorage() {}

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

     WordbookStorage.add = function() {}

     WordbookStorage.remove = function() {}

     WordbookStorage.contains = function() {}

    if (window) {
        window.wordbookStorageModule = {WordbookStorage};
    }

    return WordbookStorage;
} (this));