;(function(window, $) {
    'use strict';

    /**
     * 翻译弹窗触发模式
     */
    const TRIGGER_MODE = {
        "SHOW_ICON": "1",   // 显示图标，点击图标后翻译
        "DIRECT": "2",      // 直接翻译        
        "NEVER": "3"        // 不进行翻译
    };

    /**
     * 弹窗样式
     */
    const POPOVER_STYLE = {
        "SIMPLE": "simple",     // 简单样式
        "GRAPHIC": "graphic"    // 图文样式
    };

    let triggerMode,            // 弹窗触发模式
        popoverStyle,           // 弹窗样式
        $supportEl,             // 辅助元素
        $popover,               // 弹窗
        preSelectedWord;        // 前一个选中内容
        

    function initGlobalEventListener() {
        // 获取弹窗触发模式
        getStorageInfo([
            'baicizhanHelper.triggerMode',
            'baicizhanHelper.popoverStyle',
        ])
        .then(result => {
            triggerMode = result['baicizhanHelper.triggerMode'] || TRIGGER_MODE.SHOW_ICON;
            popoverStyle = result['baicizhanHelper.popoverStyle'] || POPOVER_STYLE.SIMPLE;

            window.addEventListener('mouseup', () => {
                let selectedWord = window.getSelection().toString().trim();

                // 不为空且为英文
                if (selectedWord == '' || !/^[a-zA-Z\\-\s']+$/.test(selectedWord)) {
                    return;
                }

                if (preSelectedWord === selectedWord) {
                    return;
                }

                prepopup().then(isPopup => isPopup && showTranslatePopover(selectedWord));                    
            });
        });

        $supportEl = createSupportEl();
    }

    /**
     * 创建辅助 div 元素
     * 
     * @return 辅助定位使用的 div 元素
     */
    function createSupportEl() {
        return $(`
                    <div 
                        id="_baicizhanHelperSupportDiv" 
                        style="position: absolute;">
                    </div>
                `)
                .appendTo(document.body);
    }

    /**
     * 弹出弹窗前置处理
     */
     function prepopup() {
        // 辅助元素显示
        $supportEl.css('display', 'block');

        // 更新辅助元素位置
        updateSupportElPosition();        

        // 根据配置进行不同的显示策略
        return new Promise(resolve => {
            if (triggerMode == TRIGGER_MODE.DIRECT) {
                return resolve(true);
            }
    
            if (triggerMode == TRIGGER_MODE.SHOW_ICON) {
                // icon 显示，点击时返回 true，消失时返回 false
                $supportEl.iconTips({
                    imgSrc: `chrome-extension://${chrome.runtime.id}/baicizhan-helper.png`,
                    onClick: () => {
                        resolve(true);
                        $supportEl.iconTips('destroy');
                    },
                    onHide: () => {
                        resolve(false);
                        $supportEl.iconTips('destroy');
                        $supportEl.css('display', 'none');
                    }
                });

                return;
            }

            return resolve(false);
        });        
    };

    /**
     * 根据选中区域更新辅助元素位置
     */
    function updateSupportElPosition() {
        let rect = window.getSelection().getRangeAt(0).getBoundingClientRect();

        $supportEl.css('top', rect.top + window.scrollY)
                .css('left', rect.left + window.scrollX)
                .css('height', rect.height)
                .css('width', rect.width);
    }

    /**
     * 弹出弹窗
     */
    function showTranslatePopover(word) {                       
        if ($popover) {
            $popover.destory();
        }

        getWordInfo(word)
            .then(resp => {
                // 查询不到对应的单词
                if (!resp) return;

                $popover = new MyWebuiPopover({
                    $el: $supportEl,
                    wordInfo: resp.data.dict,
                    style: popoverStyle,
                    collectWord
                });

                setTimeout(() => $popover.show(), 100);
            });

        preSelectedWord = word;
    };

    /**
     * 获取本地存储值
     * 
     * @param {Array<String>} keys 键名数组
     * @returns 对应键值
     */
    function getStorageInfo(keys = []) {
        return sendRequest({action: 'getStorageInfo', keys});
    }

    /**
     * 获取单词信息
     * 
     * @param {String} word 单词
     * @returns 单词信息
     */
    function getWordInfo(word) {
        if (!word || word.trim() == '') {
            return Promise.resolve(null);
        }

        return sendRequest({action: 'getWordInfo', word});
    }

    /**
     * 收藏单词
     * 
     * @param {String} word 单词
     * @returns 是否成功
     */
    function collectWord(word) {
        if (!word || word.trim() == '') {
            return Promise.resolve(false);
        }

        return sendRequest({action: 'collectWord', word});
    }

    function sendRequest(data) {
        return new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(data, (result) => {
                    if (typeof result === 'string') {
                        // 未登录或未选择单词本，跳转管理页
                        if (result == 'Unauthorized' || result == 'Not selected') {
                            window.location = `chrome-extension://${chrome.runtime.id}/index.html`;
                            return;
                        }
                        
                        reject(new Error(result));
                    }

                    resolve(result);
                });
            }
        );
    }

    // 初始化
    window.onload = initGlobalEventListener;
}) (this, jQuery);