;(function(window) {
    'use strict';

    /**
     * 辅助元素
     */
    var $auxiliaryEl;
    /**
     * 弹窗模板
     */
    var POPOVER_TEMPLATE = '<div class="webui-popover">' +
                                '<div class="webui-arrow"></div>' +
                                '<div class="webui-popover-inner">' +
                                    '<a class="plus"><span class="glyphicon glyphicon-star add-word"></span></a>' +
                                    '<h3 class="webui-popover-title"></h3>' +
                                    '<div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div>' +
                                '</div>' +
                            '</div>';
    /**
     * 资源（音频、图片）域名
     */
    var RESOURCE_HOST = "https://7n.bczcdn.com";

    function initial() {
        // 创建辅助元素
        createAuxiliaryElement();

        // 初始化事件
        initialEvent();
    }

    function createAuxiliaryElement() {
        $(document.body).append('<div id="auxiliaryDiv"></div>');

        $auxiliaryEl = $('#auxiliaryDiv');
    }

    function initialEvent() {
        window.addEventListener('mouseup', function() {
            var selectedContent = window.getSelection().toString();

            if (selectedContent == '' || selectedContent.trim() == '') {
                return;
            }

            // 只翻译英文
            if (!/^[a-zA-Z\\-\s]+$/.test(selectedContent)) {
                return;
            }

            showIcon();
        });
    }

    function showIcon() {
        var iconTips = $.data($auxiliaryEl.get(0), 'plugin_iconTips');

        if (iconTips && iconTips.isShow()) {
            return;
        }

        updateAuxiliaryElementPosition();

        if (!iconTips) {
            $auxiliaryEl.iconTips({
                imgSrc: './images/baicizhan-helper.png',
                onClick: function($el) {
                    $auxiliaryEl.iconTips('hide');

                    showTranslatePopover();
                },
                onHide: function($el) {
                    // 防止辅助元素遮挡文本，影响文本的复制
                    $auxiliaryEl.css('display', 'none');
                }
             });

             $auxiliaryEl.iconTips('show');
        } else if (!iconTips.isShow()) {
            $auxiliaryEl.iconTips('refreshPosition');
            $auxiliaryEl.iconTips('show');
        }
    }

    function showTranslatePopover() {
        var content = window.getSelection().toString().trim();

        sendMessage({
            action: 'get',
            word: content
        })
        .then(function(response) {
            // TODO 查询错误处理
            var data = response.data.dict_wiki.dict;

            // 显示辅助元素以保证弹窗定位准确
            $auxiliaryEl.css('display', 'block')
                        .webuiPopover({
                            title: data.word_basic_info.word,
                            content: generateContentHtml(data),
                            trigger: 'click',
                            template: POPOVER_TEMPLATE,
                            onHide: function($el) {
                                clearPopover($el);
                            },
                            onShow: function($el) {
                                initialPopoverElementEvent($el, data);
                            }
                        });
    
            setTimeout(function() {
                $auxiliaryEl.trigger('click');
            }, 100);
        });
    }

    /**
     * 根据鼠标选中区域更新辅助元素位置
     */
    function updateAuxiliaryElementPosition() {
        var range = window.getSelection().getRangeAt(0);
        var rect = range.getBoundingClientRect();

        $auxiliaryEl.css('display', 'block')
                    .css('top', rect.top + document.body.scrollTop)
                    .css('left', rect.left + document.body.scrollLeft)
                    .css('height', rect.height)
                    .css('width', rect.width);
    }

    /**
     * 根据查询结果渲染 popover 内容
     * 
     * @param {Object} data 
     * @returns 
     */
    function generateContentHtml(data) {
        // 读音显示
        var ukAccent = data.word_basic_info.accent_uk.trim();
        var usaAccent = data.word_basic_info.accent_usa.trim();
        var accentHtml;

        if (ukAccent == usaAccent) {
            accentHtml = '<p>' + ukAccent + '<span class="glyphicon glyphicon-volume-up accent"></span></p>';
        } else {
            accentHtml = '<p>' + ukAccent + '<span class="glyphicon glyphicon-volume-up accent"></span>' +
                '&nbsp;' + usaAccent + '<span class="glyphicon glyphicon-volume-up accent"></span></p>';
        }

        // 中文解释显示
        var group = {};
        data.chn_means.forEach(function(mean) {
            var meanType = mean.mean_type;

            if (!group[meanType]) {
                group[meanType] = mean.mean.split('，');
            } else {
                Array.prototype.push.apply(group[meanType], mean.mean.split('，'));
            }
        });
        
        var meansHtml = Object.entries(group)
            .map(function(e) {
                return '<p>' + e[0] + '&nbsp;' + e[1].join(';') + '</p>';
            })
            .join('\n');

        return accentHtml + meansHtml;
    }

    /**
     * 初始化 popover 中的元素事件
     * 
     * @param {Element} $el 
     * @param {Object} data 
     */
    function initialPopoverElementEvent($el, data) {
        // 添加单词添加事件
        $el.find('.plus').click(function() {
            var that = $(this);

            that.css('color', 'red');

            // TODO 用户尚未选择单词本提示
            sendMessage({
                action: 'addWord',
                word: data.word_basic_info.word
            })
            .then(function(response) {
                // TODO 页面显示添加失败
                if (!response.data) {
                    return console.warn('收录单词失败');
                }
            });

            return false;
        });
        
        // 添加读音
        $el.find('.accent').each(function(index, icon) {
            var $icon = $(icon);
            var audio = createAudio(index, index ? 
                    RESOURCE_HOST + data.word_basic_info.accent_usa_audio_uri :
                    RESOURCE_HOST + data.word_basic_info.accent_uk_audio_uri);

            $icon.click(function() {
                audio.play();                
            });
        });
    }

    function createAudio(index, audioSrc) {
        var $audio = $(
            '<audio id="_helper_wordAccentAudio_' + index + '">' +
                '<source src="' + audioSrc + '" type="audio/mpeg">' +
            '</audio>'
        );

        $(document.body).append($audio.css('display', 'none'));

        return $audio.get(0);
    }

    /**
     * 清除 popover 以及相关元素
     * 
     * @param {Element} $el 
     */
    function clearPopover($el) {
	    // 销毁音频元素
        $('#_helper_wordAccentAudio_0, #_helper_wordAccentAudio_1').remove();

        // 销毁 popover
        $auxiliaryEl.webuiPopover('destroy');

        // 防止阻碍原先文本选中
        $auxiliaryEl.css('display', 'none');
    }

    function sendMessage(data) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(data, function(response) {
                // 未登录跳转配置页
                if (response.code == 401) {
                    // 清除本地 token 缓存
                    chrome.storage.local.remove('baicizhanHelper.accessToken');

                    redirectOptionsPage();
                    return;
                }

                // 未选择单词本，跳转配职页
                if (response.code == 400 && response.message == '未选择单词本') {
                    redirectOptionsPage();
                    return;
                }

                resolve(response);
            });
        });
    }

    function redirectOptionsPage() {
        window.location = 'chrome-extension://' + chrome.runtime.id + '/options.html';
    }

    window.onload = initial;
}) (this);
