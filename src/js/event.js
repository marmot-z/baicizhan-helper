;(function(window) {
    'use strict';

    /**
     * 用户验证成功事件
     * 
     * 登录成功或本地已有登录信息时触发
     */
    const AUTHED = 'bcz.authed';

    /**
     * 用户未验证事件
     * 
     * 退出或本地无登录信息时触发
     */
    const UNAUTHED = 'bcz.unauthed';

    /**
     * 单词本列表记载成功事件
     */
    const BOOKS_LOADED = 'bcz.booksLoaded';

    /**
     * 加载单词详情
     */
    const WORD_DETAIL = 'bcz.wordDetail';

    /**
     * 开启背单词
     */
    const ENABLE_STUDY = 'bcz.enableStudy';

    /**
     * 关闭背单词
     */
    const DISABLE_STUDY = 'bcz.disableStudy';

    window.events = {AUTHED, UNAUTHED, BOOKS_LOADED, WORD_DETAIL, ENABLE_STUDY, DISABLE_STUDY};
} (this));