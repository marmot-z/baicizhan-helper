;(function(window, $) {
    'use strict';

    const TRIGGER_MODE = {'SHOW_ICON': 'showIcon','DIRECT': 'direct','NEVER': 'never'},
            POPOVER_STYLE = {'SIMPLE': 'simple', 'RICH': 'rich'},
            THEME = {'LIGHT': 'light', 'DARK': 'dark', 'AUTO': 'auto'};
    const defaultTriggerMode = TRIGGER_MODE.SHOW_ICON, 
            defaultPopoverStyle = POPOVER_STYLE.SIMPLE,
            defaultTheme = THEME.LIGHT;
    let triggerMode, popoverStyle, theme, $popover, preWord;    
    const $toastElement = {
        init: function() {
            let iconSrc = `chrome-extension://${chrome.runtime.id}/icon.png`;
            this.$el = $(`                
                <div id="_baicizhanHelperToast" class="toast" data-delay="3000"
                    style="position: fixed; top: 10px; right: 10px; z-index: 9999; min-width: 200px;">
                    <div class="toast-header">
                        <img src="${iconSrc}" class="rounded mr-2" style="height: 20px; widht: 20px;">
                        <strong class="mr-auto">Baicizhan-helper</strong>
                        <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="toast-body">
                        Hello, world! This is a toast message.
                    </div>
                </div>
            `);
            this.$el.appendTo(document.body);
        }, 
        alert: function(message) {
            this.$el.find('.toast-body').html(message);
            this.$el.toast('show');
        }
    };
    const $supportElement = {
        init: function() {
            this.$el = $(`<div id="_baicizhanHelperSupportDiv" style="position: absolute;"></div>`);
            this.$el.appendTo(document.body);
            this.$el.on('baicizhanHelper:alert', (e, message) => {
                $toastElement.alert(message);
            });
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
                    this.hide();
                    onHide();
                }
            });
        },
        destoryIconTips: function() {
            this.$el.iconTips('destroy');
        }
    };

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

            // 判断当前系统的主题
            if (theme == THEME.AUTO) {
                let isSystemDarkTheme = window.matchMedia && 
                        window.matchMedia('(prefers-color-scheme: dark)').matches;

                theme = isSystemDarkTheme ? THEME.DARK : THEME.LIGHT;
            }
        });
    }

    async function selectWordHandler() {
        let selectedWord = window.getSelection().toString().trim();

        // 不为空且为英文
        if (selectedWord == '' || !/^[a-zA-Z\\-\s']+$/.test(selectedWord)) {
            return;
        }

        if (preWord === selectedWord) {
            return;
        }

        prepopup();

        (await canPopup()) && popup(selectedWord);
    }

    function prepopup() {
        $supportElement.display();
        $supportElement.updatePosition();
    }

    function canPopup() {
        if (triggerMode == TRIGGER_MODE.DIRECT) {
            return Promise.resolve(true);
        }
        if (triggerMode == TRIGGER_MODE.NEVER) {
            return Promise.resolve(false);
        }

        return new Promise(resolve => {
            $supportElement.createIconTips(
                () => resolve(true),
                () => resolve(false)
            )
        });
    }

    function popup(word) {
        // 销毁上一个 $popover
        $popover && $popover.destory();

        // TODO 很多单词为原单词的复数等形态（如：words -> 原单词应为 word），容易误显示
        // 尝试使用 NLP 将单词转换为词根形式
        sendRequest({action: 'getWordInfo', args: [word]}).then(response => {
            if (!response) return;

            $popover = new MyWebuiPopover({
                $el: $supportElement.$el,
                wordInfo: response.dict,
                popoverStyle,
                theme
            });

            window.setTimeout(() => $popover.show(), 100);
        });
    }

    function sendRequest(option) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(option, (result) => {
                // 以 [Error]: 开头代表请求报错
                if (result instanceof String && result.startsWith('[Error]:')) {
                    return reject(new Error(result.substring(8)));
                }
                
                resolve(result);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);
} (this, jQuery)); 