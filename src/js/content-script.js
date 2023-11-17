;(function(window, $) {
    'use strict';

    const {WordWebuiPopover, PhraseWebuiPopover, Toast, EnglishStemmer} = window.__baicizhanHelperModule__;
    const TRIGGER_MODE = {'SHOW_ICON': 'showIcon','DIRECT': 'direct','NEVER': 'never'};
    const POPOVER_STYLE = {'SIMPLE': 'simple', 'RICH': 'rich'};
    const THEME = {'LIGHT': 'light', 'DARK': 'dark', 'AUTO': 'auto'};
    const defaultTriggerMode = TRIGGER_MODE.SHOW_ICON; 
    const defaultPopoverStyle = POPOVER_STYLE.SIMPLE;
    const defaultTheme = THEME.LIGHT;    
    const stemmer = new EnglishStemmer();
    const $toastElement = new Toast();    
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
            let rect = window.getSelection().getRangeAt(0).getBoundingClientRect();

            this.$el.css('top',    rect.top + window.scrollY)
                    .css('left',   rect.left + window.scrollX)
                    .css('height', rect.height)
                    .css('width',  rect.width);
        },
        createIconTips: function(onClick, onHide) {
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
        },
        destoryIconTips: function() {
            this.$el.iconTips('destroy');
        }
    };
    let triggerMode, popoverStyle, theme, $popover, preWord, popuped = false;

    function init() {
        loadSetting();
        $toastElement.init();
        $supportElement.init();
        window.addEventListener('mouseup', selectWordHandler);
    }

    function loadSetting() {
        sendRequest({
            action: 'getStorageInfo',
            args: ['triggerMode', 'popoverStyle', 'theme']
        })
        .then(([_triggerMode, _popoverStyle, _theme]) => {
            triggerMode = _triggerMode || defaultTriggerMode;
            popoverStyle = _popoverStyle || defaultPopoverStyle;
            theme = _theme || defaultTheme;

            if (theme == THEME.AUTO) {
                let isSystemDarkTheme = window.matchMedia && 
                        window.matchMedia('(prefers-color-scheme: dark)').matches;

                theme = isSystemDarkTheme ? THEME.DARK : THEME.LIGHT;
            }
        });
    }

    async function selectWordHandler(e) {
        e.preventDefault();

        // if event not left click, omit 
        if (e.which != 1) {
            return;
        }

        // TODO 增加是否可以使用 bing 翻译的判断
        let selectedContent = window.getSelection().toString().trim();        

        if (popuped || selectedContent == '' || selectedContent.length > 300) {            
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
        return str.split('').every(char => /\p{Script=Han}/u.test(char));
    }

    function isEnglishWord(str) {
        let englishWordRegex = /^[a-zA-Z\\-]+$/;
        return englishWordRegex.test(str);
    }

    function popupWordWebuiPopover(word) {
        // 词干提取，如：words -> word
        let stemWord = stemmer.stemWord(word);

        sendRequest({action: 'getWordInfo', args: stemWord}).then(response => {
            if (!response) return;

            $popover = new WordWebuiPopover({
                $el: $supportElement.$el,
                wordInfo: response.dict,
                popoverStyle,
                theme,
                onHide: () => popuped = false
            });

            window.setTimeout(() => {
                popuped = true;
                $popover.show()
            }, 100);
        })
        .catch(e => {
            console.error(e);
            $supportElement.$el.trigger('baicizhanHelper:alert', ['查询失败，稍后再试']);
        })
    }

    function popupPhraseWebuiPopover(phrase) {
        sendRequest({action: 'translate', args: phrase}).then(response => {
            if (!response) return;

            $popover = new PhraseWebuiPopover({
                $el: $supportElement.$el,
                translation: response.translation,
                onHide: () => popuped = false
            });

            window.setTimeout(() => {
                popuped = true;
                $popover.show()
            }, 100);
        })
        .catch(e => {
            console.error(e);
            $supportElement.$el.trigger('baicizhanHelper:alert', ['查询失败，稍后再试']);
        })
    }

    function sendRequest(option) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(option, (result) => {
                // 以 [Error]: 开头代表请求报错
                if (typeof result === 'string' && result.startsWith('[Error]:')) {
                    return reject(new Error(result.substring(8)));
                }

                resolve(result);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);
} (this, jQuery)); 