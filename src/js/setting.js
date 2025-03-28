; (function (window, document, $) {
    'use strict';

    const $doc = $(document);
    const { getBooks } = window.apiModule;
    const defaultWordDetailSettings = {
        variantDisplay: false,
        sentenceDisplay: true,
        shortPhrasesDisplay: false,
        synonymsDisplay: false,
        antonymsDisplay: false,
        similarWordsDisplay: false,
        englishParaphraseDisplay: false,
    };
    const defaultHighlightSettings = {
        enabled: true,
        style: 'underline',
        color: '#2196F3'
    };

    function loadWordbook() {
        return getBooks().then(data => {
            let html = data.user_books.map(book =>
                `<option value="${book.user_book_id}">${book.book_name}(已收录 ${book.word_num} 词)</option>`
            )
                .join('');

            $('#collectWordbookSelect').html(html);
            $doc.trigger(events.BOOKS_LOADED, [data]);
        })
            .catch(e => console.error('加载单词本失败', e));
    }

    function loadSettings() {
        storageModule.get('bookId')
            .then(bookId => $('#collectWordbookSelect').val(bookId || 0));
        storageModule.get('popoverStyle')
            .then(popoverStyle => {
                if (!popoverStyle) return;
                $('input[name="popoverStyle"]').filter(`[value=${popoverStyle}]`).prop("checked", true)
            });
        storageModule.get('triggerMode')
            .then(triggerMode => {
                if (!triggerMode) return;
                $('input[name="triggerMode"]').filter(`[value=${triggerMode}]`).prop("checked", true)
            });    
        storageModule.get('theme')
            .then(theme => {
                if (!theme) return;
                $('input[name="theme"]').filter(`[value=${theme}]`).prop("checked", true)
            });
        storageModule.get('host')
            .then(host => $('#hostInput').val(host || apiModule.defaultHost));
        storageModule.get('port')
            .then(port => $('#portInput').val(port || apiModule.defaultPort));
        storageModule.get('collectShortcutkey')
            .then(shortcutKey => $('#collectShortcutKeyInput').val(shortcutKey));
        storageModule.get('enableStudy')
            .then(enableStudy => {
                let enable = !!enableStudy;
                $('#enableStudyInput').prop('checked', enable);
                enable && $doc.trigger(events.ENABLE_STUDY);
            });
        storageModule.get('wordDetail')
            .then(wordDetailSettings => {
                let settings = wordDetailSettings ?
                    Object.assign(defaultWordDetailSettings, wordDetailSettings) :
                    defaultWordDetailSettings;

                if (settings.variantDisplay)
                    $('#showVariantCheck').prop('checked', true);
                if (settings.sentenceDisplay)
                    $('#showSentenceCheck').prop('checked', true);
                if (settings.shortPhrasesDisplay)
                    $('#showShortPhrasesCheck').prop('checked', true);
                if (settings.synonymsDisplay)
                    $('#showSynonymsCheck').prop('checked', true);
                if (settings.antonymsDisplay)
                    $('#showAntonymsCheck').prop('checked', true);
                if (settings.similarWordsDisplay)
                    $('#showSimilarWordsCheck').prop('checked', true);
                if (settings.englishParaphraseDisplay)
                    $('#showEnglishParaphraseCheck').prop('checked', true);
            });

        // 加载高亮设置
        chrome.storage.local.get(['highlightSettings']).then(result => {
            const settings = result.highlightSettings || defaultHighlightSettings;
            
            $('#enablePageHighlight').prop('checked', settings.enabled);
            $('#highlightStyle').val(settings.style);
            $('#highlightColor').val(settings.color);
            
            // 更新预设颜色按钮的激活状态
            $('.color-preset').removeClass('active');
            $(`.color-preset[data-color="${settings.color}"]`).addClass('active');
            
            // 根据启用状态显示/隐藏样式设置
            $('#highlightStyleSettings').toggle(settings.enabled);
            
            // 更新预览效果
            updateHighlightPreview();
            
            // 如果是第一次加载，保存默认设置
            if (!result.highlightSettings) {
                saveHighlightSettings();
            }
        });
    }

    function reset() {
        $('#collectWordbookSelect').val('0');
        $('input[name="popoverStyle"]').first().prop("checked", true);
        $('input[name="triggerMode"]').first().prop("checked", true);
        $('input[name="theme"]').first().prop("checked", true);
        $('#bingTransalteCheck').prop("checked", false);
        $('#showVariantCheck').prop('checked', false);
        $('#showSentenceCheck').prop('checked', true);
        $('#showShortPhrasesCheck').prop('checked', false);
        $('#showSynonymsCheck').prop('checked', false);
        $('#showAntonymsCheck').prop('checked', false);
        $('#showSimilarWordsCheck').prop('checked', false);
        $('#showEnglishParaphraseCheck').prop('checked', false);
        $('#collectShortcutKeyInput').val('');
        $('#enableStudyInput').prop('checked', false);
        $('#hostInput').val(apiModule.defaultHost);
        $('#portInput').val(apiModule.defaultPort);

        // 重置高亮设置为默认值
        $('#enablePageHighlight').prop('checked', defaultHighlightSettings.enabled);
        $('#highlightStyle').val(defaultHighlightSettings.style);
        $('#highlightColor').val(defaultHighlightSettings.color);
        $('#highlightStyleSettings').toggle(defaultHighlightSettings.enabled);
        
        // 更新预设颜色按钮状态
        $('.color-preset').removeClass('active');
        $(`.color-preset[data-color="${defaultHighlightSettings.color}"]`).addClass('active');
        
        updateHighlightPreview();
    }

    function save() {
        window.Analytics.fireEvent('saveSettings', { });

        let bookId = $('#collectWordbookSelect').val();
        let popoverStyle = $('input[name="popoverStyle"]:checked').val();
        let triggerMode = $('input[name="triggerMode"]:checked').val();
        let theme = $('input[name="theme"]:checked').val();
        let host = $('#hostInput').val();
        let port = $('#portInput').val();
        let variantDisplay = $('#showVariantCheck').prop('checked');
        let sentenceDisplay = $('#showSentenceCheck').prop('checked');
        let shortPhrasesDisplay = $('#showShortPhrasesCheck').prop('checked');
        let synonymsDisplay = $('#showSynonymsCheck').prop('checked');
        let antonymsDisplay = $('#showAntonymsCheck').prop('checked');
        let similarWordsDisplay = $('#showSimilarWordsCheck').prop('checked');
        let englishParaphraseDisplay = $('#showEnglishParaphraseCheck').prop('checked');
        let collectShortcutkey = $('#collectShortcutKeyInput').val().trim();
        let enableStudy = $('#enableStudyInput').prop('checked');

        storageModule.set('bookId', bookId);
        storageModule.set('popoverStyle', popoverStyle);
        storageModule.set('triggerMode', triggerMode);
        storageModule.set('theme', theme);
        storageModule.set('host', host);
        storageModule.set('port', port);
        storageModule.set('collectShortcutkey', collectShortcutkey);
        storageModule.set('enableStudy', enableStudy);
        storageModule.set('wordDetail', {
            variantDisplay,
            sentenceDisplay,
            shortPhrasesDisplay,
            synonymsDisplay,
            antonymsDisplay,
            similarWordsDisplay,
            englishParaphraseDisplay,
        });
    }

    function clearStorage() {
        storageModule.remove(
            ['accessToken', 'bookId', 'bookPlanInfo', 'bookWords', 'learnedWords', 'loadLearnedWordsTimestamp']);
    }

    function recordShortcutKey() {
        let pressing = false;
        let pressedMap = {};

        // 收藏/取消收藏快捷键录制
        $('#collectShortcutKeyInput').on('keydown', function(e) {
            if (!pressing) {
                pressedMap = {};
            }

            pressing = true;
            pressedMap[e.key] = true;
        });
        $('#collectShortcutKeyInput').on('keyup', function(e) {
            pressedMap[e.key] = false;
            let allKeyUp = Object.values(pressedMap).every(down => !down);

            if (allKeyUp) {
                pressing = false;
                let shortcutKey = Object.keys(pressedMap).join('+');
                $(this).val(shortcutKey);
            }
        });
    }

    function init() {
        $doc.on(events.AUTHED, () => loadWordbook().finally(loadSettings));
        $doc.on(events.UNAUTHED, clearStorage);
        recordShortcutKey();

        $('#enableStudyInput').on('click', e => {
            let event = $('#enableStudyInput').prop('checked') ? events.ENABLE_STUDY : events.DISABLE_STUDY;
            $doc.trigger(event);
        });

        $('#resetButton').on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            reset();
        });
        $('#submitButton').on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            save();
            alert('保存成功');
        });

        // 添加高亮设置相关事件处理
        $('#enablePageHighlight').on('change', function() {
            const enabled = $(this).prop('checked');
            $('#highlightStyleSettings').toggle(enabled);
            saveHighlightSettings();
        });
        
        $('#highlightStyle, #highlightColor').on('change', function() {
            updateHighlightPreview();
            saveHighlightSettings();
        });

        // 添加预设颜色按钮事件处理
        $('.color-preset').on('click', function() {
            const color = $(this).data('color');
            $('#highlightColor').val(color);
            
            // 更新按钮激活状态
            $('.color-preset').removeClass('active');
            $(this).addClass('active');
            
            // 更新预览和保存设置
            updateHighlightPreview();
            saveHighlightSettings();
        });
    }

    // 添加高亮设置保存函数
    async function saveHighlightSettings() {
        const settings = {
            enabled: $('#enablePageHighlight').prop('checked'),
            style: $('#highlightStyle').val(),
            color: $('#highlightColor').val()
        };
        
        // 保存到 storage
        await chrome.storage.local.set({ highlightSettings: settings });
        
        // 通知所有标签页更新高亮设置
        chrome.tabs.query({}, tabs => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'updateHighlightSettings',
                    ...settings
                }).catch(() => {});
            });
        });
    }

    // 添加预览效果更新函数
    function updateHighlightPreview() {
        const style = $('#highlightStyle').val();
        const color = $('#highlightColor').val();
        const $preview = $('#colorPreview .preview-text');
        
        // 重置样式
        $preview.attr('style', 'padding: 0 2px;');
        
        // 应用新样式
        switch (style) {
            case 'background':
                $preview.css({
                    'background-color': `${color}33`,
                    'border-radius': '3px'
                });
                break;
            case 'dotted':
                $preview.css('border-bottom', `2px dotted ${color}`);
                break;
            case 'wavy':
                $preview.css('text-decoration', `wavy underline ${color}`);
                break;
            case 'dashed':
                $preview.css('border-bottom', `2px dashed ${color}`);
                break;
            case 'underline':
            default:
                $preview.css('border-bottom', `2px solid ${color}`);
        }
    }

    window.settingModule = { init };
}(this, document, jQuery));