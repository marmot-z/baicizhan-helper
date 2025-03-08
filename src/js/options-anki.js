;(function(window, document, $) {
    'use strict';

    const ankiService = new AnkiService();
    
    function showMessage(message, type = 'success') {
        const $msg = $(`
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert">
                    <span>&times;</span>
                </button>
            </div>
        `);
        
        $('.card-body').prepend($msg);
        
        setTimeout(() => {
            $msg.alert('close');
        }, 3000);
    }

    async function saveAnkiSettings(showSaveMessage = true) {
        const ankiSettings = {
            enabled: $('#enableAnkiExport').prop('checked'),
            deckName: $('#ankiDeck').val(),
            exportPhonetic: $('#exportPhonetic').prop('checked'),
            exportAudio: $('#exportAudio').prop('checked'),
            exportMeaning: $('#exportMeaning').prop('checked'),
            exportSentence: $('#exportSentence').prop('checked'),
            exportVariants: $('#exportVariants').prop('checked'),
            exportPhrases: $('#exportPhrases').prop('checked'),
            exportSynonyms: $('#exportSynonyms').prop('checked'),
            exportAntonyms: $('#exportAntonyms').prop('checked'),
            exportEnMeans: $('#exportEnMeans').prop('checked'),
            autoExport: $('#autoExport').prop('checked')
        };

        try {
            await chrome.storage.local.set({ ankiSettings });
            if (showSaveMessage) {
                showMessage('设置已保存');
            }
        } catch (error) {
            console.error('Failed to save Anki settings:', error);
            if (showSaveMessage) {
                showMessage('保存设置失败', 'danger');
            }
        }
    }

    async function initAnkiSettings() {
        const $ankiStatus = $('#ankiStatus');
        const $ankiSettingsDetails = $('#ankiSettingsDetails');
        const $enableAnkiExport = $('#enableAnkiExport');
        
        try {
            // 首先加载已保存的设置
            const settings = await chrome.storage.local.get(['ankiSettings']);
            const ankiSettings = settings.ankiSettings || {
                enabled: false,  // 默认不启用
                deckName: 'English Vocabulary',
                exportPhonetic: true,
                exportAudio: true,
                exportMeaning: true,
                exportSentence: true,
                exportVariants: true,
                exportPhrases: true,
                exportSynonyms: true,
                exportAntonyms: true,
                exportEnMeans: true,
                autoExport: true  // 默认启用自动导出
            };

            // 设置开关状态
            $enableAnkiExport.prop('checked', ankiSettings.enabled);

            // 设置导出选项的值
            $('#exportPhonetic').prop('checked', ankiSettings.exportPhonetic);
            $('#exportAudio').prop('checked', ankiSettings.exportAudio);
            $('#exportMeaning').prop('checked', ankiSettings.exportMeaning);
            $('#exportSentence').prop('checked', ankiSettings.exportSentence);
            $('#exportVariants').prop('checked', ankiSettings.exportVariants);
            $('#exportPhrases').prop('checked', ankiSettings.exportPhrases);
            $('#exportSynonyms').prop('checked', ankiSettings.exportSynonyms);
            $('#exportAntonyms').prop('checked', ankiSettings.exportAntonyms);
            $('#exportEnMeans').prop('checked', ankiSettings.exportEnMeans);
            $('#autoExport').prop('checked', ankiSettings.autoExport);

            // 如果功能已启用，则尝试连接 Anki
            if (ankiSettings.enabled) {
                $ankiStatus.show().html('正在连接 Anki...');
                
                try {
                    // 测试连接
                    await ankiService.invoke('version');
                    
                    // 获取可用的牌组
                    const decks = await ankiService.invoke('deckNames');
                    const $deckSelect = $('#ankiDeck').empty();
                    decks.forEach(deck => {
                        $deckSelect.append(`<option value="${deck}" ${deck === ankiSettings.deckName ? 'selected' : ''}>${deck}</option>`);
                    });

                    // 显示详细设置
                    $ankiSettingsDetails.show();

                    // 更新状态
                    $ankiStatus
                        .removeClass('alert-info alert-danger')
                        .addClass('alert-success')
                        .html('已连接到 Anki')
                        .fadeOut(3000);
                } catch (error) {
                    console.error('Failed to connect to Anki:', error);
                    $ankiStatus
                        .removeClass('alert-info alert-success')
                        .addClass('alert-danger')
                        .html('无法连接到 Anki，请确保：<br>1. Anki 正在运行<br>2. AnkiConnect 插件已安装<br>3. 已正确配置 AnkiConnect')
                        .show();
                    
                    // 如果连接失败但功能已启用，显示警告但不禁用功能
                    $ankiSettingsDetails.toggle(ankiSettings.enabled);
                }
            } else {
                // 功能未启用，隐藏状态和详细设置
                $ankiStatus.hide();
                $ankiSettingsDetails.hide();
            }

            // 添加开关事件处理
            $enableAnkiExport.on('change', async function() {
                const isEnabled = $(this).prop('checked');
                
                // 如果启用功能，先测试连接
                if (isEnabled) {
                    try {
                        await ankiService.invoke('version');
                        $ankiSettingsDetails.show();
                        await saveAnkiSettings(false);  // 不显示保存消息
                        
                        // 重新加载设置
                        await initAnkiSettings();
                    } catch (error) {
                        console.error('Failed to connect to Anki:', error);
                        $ankiStatus
                            .removeClass('alert-info alert-success')
                            .addClass('alert-danger')
                            .html('无法连接到 Anki，请确保：<br>1. Anki 正在运行<br>2. AnkiConnect 插件已安装<br>3. 已正确配置 AnkiConnect')
                            .show();
                        
                        // 连接失败时保持功能启用状态，让用户决定是否要禁用
                        $ankiSettingsDetails.toggle(isEnabled);
                        await saveAnkiSettings(false);  // 不显示保存消息
                    }
                } else {
                    // 禁用功能时直接隐藏详细设置并保存
                    $ankiSettingsDetails.hide();
                    await saveAnkiSettings(false);  // 不显示保存消息
                }
            });

            // 其他设置变更时保存并显示消息
            $('.form-check-input, #ankiDeck').on('change', () => saveAnkiSettings(true));

        } catch (error) {
            console.error('Failed to initialize Anki settings:', error);
            $ankiStatus
                .removeClass('alert-info alert-success')
                .addClass('alert-danger')
                .html('初始化设置失败')
                .show();
        }
    }

    // 初始化
    $(document).ready(initAnkiSettings);

})(window, document, jQuery); 