;(function(window, $) {
    'use strict';

    // 确保在使用前初始化全局模块
    if (!window.__baicizhanHelperModule__) {
        window.__baicizhanHelperModule__ = {};
    }

    const {WordWebuiPopover, PhraseWebuiPopover, Toast, EnglishStemmer} = window.__baicizhanHelperModule__;
    const TRIGGER_MODE = {'SHOW_ICON': 'showIcon','DIRECT': 'direct','NEVER': 'never'};
    const POPOVER_STYLE = {'SIMPLE': 'simple', 'RICH': 'rich'};
    const THEME = {'LIGHT': 'light', 'DARK': 'dark', 'AUTO': 'auto'};
    const defaultTriggerMode = TRIGGER_MODE.SHOW_ICON; 
    const defaultPopoverStyle = POPOVER_STYLE.SIMPLE;
    const defaultTheme = THEME.LIGHT;    
    const stemmer = new EnglishStemmer();
    const $toastElement = new Toast();    
    let triggerMode, popoverStyle, theme, $popover, collectShortcutkey, popuped = false;

    const $supportElement = {
        init: function() {
            this.$el = $(`<div id="__baicizhanHelperSupportDiv__" style="position: absolute;"></div>`);
            this.$el.appendTo(document.body);
            this.$el.on('baicizhanHelper:alert', (e, message) => $toastElement.alert(message));
        },
        display: function() {
            this.$el.css('display', 'block');            
        },
        hide: function() {
            this.$el.css('display', 'none');
        },
        updatePosition() {
            try {
                let rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
                this.$el.css('top',    rect.top + window.scrollY)
                        .css('left',   rect.left + window.scrollX)
                        .css('height', rect.height)
                        .css('width',  rect.width);
            } catch (error) {
                console.error('Error updating position:', error);
                sendRequest({action: 'fireErrorEvent', args: [error, {'message': '翻译图标定位失败'}]});
            }
        },
        createIconTips: function(onClick, onHide) {
            try {
                let iconSrc = `chrome-extension://${chrome.runtime.id}/icon.png`;
                this.$el.iconTips({
                    imgSrc: iconSrc,
                    onClick: () => {                    
                        this.destoryIconTips();
                        onClick();
                    },
                    onHide: () => {                    
                        this.destoryIconTips();
                        postpopup();
                        onHide();
                    }
                });
            } catch (error) {
                console.error('Error creating icon tips:', error);
                sendRequest({action: 'fireErrorEvent', args: [error, {'message': '创建翻译图标失败'}]});
            }
        },
        destoryIconTips: function() {
            try {
                this.$el.iconTips('destroy');
            } catch (error) {
                console.error('Error destroying icon tips:', error);
                sendRequest({action: 'fireErrorEvent', args: [error, {'message': '销毁翻译图标失败'}]});
            }
        }
    };

    async function init() {
        try {
            await loadSetting();

            if (triggerMode == TRIGGER_MODE.NEVER) {
                return;
            }

            $toastElement.init();
            $supportElement.init();
            window.addEventListener('mouseup', selectWordHandler);
        } catch (error) {
            console.error('Error initializing:', error);
            sendRequest({action: 'fireErrorEvent', args: [error, {'message': 'content-script初始化失败'}]});
        }
    }

    async function loadSetting() {
        try {
            const response = await sendRequest({
                action: 'getStorageInfo',
                args: [['triggerMode', 'popoverStyle', 'theme', 'collectShortcutkey']]
            });

            if (response) {
                const [_triggerMode, _popoverStyle, _theme, _collectShortcutkey] = response;
                triggerMode = _triggerMode || defaultTriggerMode;
                popoverStyle = _popoverStyle || defaultPopoverStyle;
                theme = _theme || defaultTheme;
                collectShortcutkey = _collectShortcutkey;

                if (theme == THEME.AUTO) {
                    let isSystemDarkTheme = window.matchMedia && 
                            window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = isSystemDarkTheme ? THEME.DARK : THEME.LIGHT;
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            sendRequest({action: 'fireErrorEvent', args: [error, {'message': '加载设置失败'}]});
            triggerMode = defaultTriggerMode;
            popoverStyle = defaultPopoverStyle;
            theme = defaultTheme;
        }
    }

    async function selectWordHandler(e) {
        e.preventDefault();

        // if event not left click, omit 
        if (e.which != 1) {
            return;
        }

        let selectedContent = window.getSelection().toString().trim();        

        if (popuped || selectedContent == '') {            
            return;
        }

        if (selectedContent.length > 300) {
            return;
        }

        prepopup();

        (await canPopup()) && popup(selectedContent);
    }

    function prepopup() {
        $supportElement.display();
        $supportElement.updatePosition();
    }

    function postpopup() {
        $supportElement.hide();
    }

    function canPopup() {
        if (triggerMode == TRIGGER_MODE.DIRECT) {
            postpopup();
            return Promise.resolve(true);
        }
        
        if (triggerMode == TRIGGER_MODE.NEVER) {  
            postpopup();  
            return Promise.resolve(false);
        }

        return new Promise(resolve => {
            $supportElement.createIconTips(
                // click
                () => resolve(true),
                // hide
                () => resolve(false)
            )
        });
    }    

    function popup(content) {
        // 销毁上一个 $popover
        $popover && $popover.destory();

        if (isChineseWord(content) || isEnglishWord(content)) {
            popupWordWebuiPopover(content);
        } else {
            popupPhraseWebuiPopover(content);
        }        
    }

    function isChineseWord(str) {
        return str.length <= 8 && 
            str.split('').every(char => /\p{Script=Han}/u.test(char));
    }

    function isEnglishWord(str) {
        let englishWordRegex = /^[a-zA-Z\\-]+$/;
        return englishWordRegex.test(str);
    }

    function popupWordWebuiPopover(word) {
        sendRequest({action: 'fireEvent', args: ['selectWord', {'word': word}]});
        sendRequest({action: 'getWordInfo', args: [word]}).then(response => {
            if (!response) return;

            $popover = new WordWebuiPopover({
                $el: $supportElement.$el,
                wordInfo: response.dict,
                popoverStyle,
                theme,
                collectShortcutkey,
                onHide: () => popuped = false
            });

            window.setTimeout(() => {
                popuped = true;
                $popover.show()
            }, 100);
        })
        .catch(e => {
            console.error(e);
            sendRequest({action: 'fireErrorEvent', args: [e, {'message': '翻译单词失败'}]});
            $supportElement.$el.css('display', 'none');
            $supportElement.$el.trigger('baicizhanHelper:alert', [e.message || '查询失败，稍后再试']);
        })
    }

    function popupPhraseWebuiPopover(phrase) {
        sendRequest({action: 'fireEvent', args: ['translatePharse', {'phrase': phrase}]});
        sendRequest({action: 'translate', args: [phrase]}).then(response => {
            if (!response) {
                throw new Error('翻译失败，返回结果为空');
            }

            $popover = new PhraseWebuiPopover({
                $el: $supportElement.$el,
                translation: response.translatedText,
                onHide: () => popuped = false
            });

            window.setTimeout(() => {
                popuped = true;
                $popover.show()
            }, 100);
        })
        .catch(e => {
            console.error(e);
            sendRequest({action: 'fireErrorEvent', args: [e, {'message': '翻译句子失败'}]});
            $supportElement.$el.css('display', 'none');
            $supportElement.$el.trigger('baicizhanHelper:alert', ['翻译失败，稍后再试']);
        })
    }

    function sendRequest(option) {
        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage(option, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    if (typeof result === 'string' && result.startsWith('[Error]:')) {
                        reject(new Error(result.substring(8)));
                        return;
                    }
                    resolve(result);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // 在页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window, jQuery); 