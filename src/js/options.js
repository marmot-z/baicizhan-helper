;(function(window, document, $) {
    'use strict';

    const $doc = $(document);

    async function checkUpgrade() {
        let latestVersion = await apiModule.getLatestVersion();
        let currentVersion = window.__baicizhanHelper__.version;
        let hasNewVersion = latestVersion > currentVersion;

        if (hasNewVersion) {
            let $tips = $('#versionTips');
            $tips.find('strong').text(currentVersion);
            $tips.show();            
        }
    }

    async function init() {
        loginModule.init();
        settingModule.init();
        wordbookModule.init();
        studyModule.init();
        checkUpgrade();

        let accessToken = await storageModule.get('accessToken');
        let event = accessToken ? events.AUTHED : events.UNAUTHED;

        $doc.trigger(event);
    }

    window.onload = init;

    // 添加导出功能
    async function exportAllToAnki() {
        const exportBtn = document.getElementById('exportToAnki');
        const progressDiv = document.getElementById('exportProgress');
        const progressBar = progressDiv.querySelector('.progress-bar');
        const exportedCount = document.getElementById('exportedCount');
        const totalCount = document.getElementById('totalCount');

        try {
            exportBtn.disabled = true;
            exportBtn.textContent = '导出中...';
            
            const bookId = $('#wordbookSelect').val() || await storageModule.get('bookId') || 0;
            const words = await window.wordbookStorageModule.WordbookStorage.load(bookId);
            
            if (!words || words.length === 0) {
                showMessage('没有找到收藏的单词');
                return;
            }
            
            progressDiv.style.display = 'block';
            totalCount.textContent = words.length;
            exportedCount.textContent = '0';
            progressBar.style.width = '0%';
            
            const ankiService = new AnkiService();
            let exported = 0;
            let skipped = 0;

            try {
                await ankiService.invoke('version');
            } catch (error) {
                showMessage('请确保 Anki 正在运行且已安装 AnkiConnect 插件');
                return;
            }

            const models = await ankiService.invoke('modelNames');
            if (!models.includes('BaiCiZhan Basic')) {
                await ankiService.createBasicModel();
            }

            const settings = await chrome.storage.local.get(['ankiSettings']);
            const ankiSettings = settings.ankiSettings || {
                enabled: true,
                deckName: 'English Vocabulary',
                exportPhonetic: true,
                exportAudio: true,
                exportMeaning: true,
                exportSentence: true,
                exportImage: true,
                exportVariants: true,
                exportPhrases: true,
                exportSynonyms: true,
                exportAntonyms: true,
                exportEnMeans: true
            };

            const decks = await ankiService.invoke('deckNames');
            if (!decks.includes(ankiSettings.deckName)) {
                await ankiService.createDeck(ankiSettings.deckName);
            }

            for (const wordItem of words) {
                try {
                    progressBar.style.width = `${((exported + skipped) / words.length) * 100}%`;
                    progressBar.textContent = `${Math.round(((exported + skipped) / words.length) * 100)}%`;
                    exportedCount.textContent = `${exported}${skipped > 0 ? ` (已跳过 ${skipped} 个重复单词)` : ''}`;

                    const wordDetail = await window.apiModule.getWordDetail(wordItem.topic_id);
                    if (!wordDetail) {
                        skipped++;
                        continue;
                    }

                    const wordData = {
                        word: wordDetail.dict.word_basic_info.word,
                        accent: wordDetail.dict.word_basic_info.accent_uk,
                        meaning: wordDetail.dict.chn_means.map(m => ({
                            type: m.mean_type,
                            mean: m.mean
                        })),
                        image: wordDetail.dict.sentences?.[0]?.img_uri ? 
                               'https://7n.bczcdn.com' + wordDetail.dict.sentences[0].img_uri : '',
                        sentence: wordDetail.dict.sentences?.[0]?.sentence || '',
                        sentenceTrans: wordDetail.dict.sentences?.[0]?.sentence_trans || '',
                        audioUrl: 'https://7n.bczcdn.com' + wordDetail.dict.word_basic_info.accent_uk_audio_uri,
                        variants: wordDetail.dict.variant_info || null,
                        shortPhrases: wordDetail.dict.short_phrases || [],
                        synonyms: wordDetail.dict.synonyms || [],
                        antonyms: wordDetail.dict.antonyms || [],
                        enMeans: wordDetail.dict.en_means || []
                    };

                    const canAdd = await ankiService.canAddNote(
                        wordData.word,
                        wordData.accent,
                        wordData.meaning.map(m => `${m.type} ${m.mean}`).join('; ')
                    );

                    if (!canAdd) {
                        skipped++;
                        continue;
                    }

                    const result = await ankiService.addNote(
                        wordData.word,
                        wordData.accent,
                        wordData.meaning,
                        wordData.image,
                        wordData.sentence,
                        wordData.sentenceTrans,
                        wordData.audioUrl,
                        wordData.variants,
                        wordData.shortPhrases,
                        wordData.synonyms,
                        wordData.antonyms,
                        wordData.enMeans
                    );
                    
                    if (result) exported++;

                    if ((exported + skipped) % 5 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }

                } catch (err) {
                    console.error(`导出单词 ${wordItem.word} 失败:`, err);
                    skipped++;
                }
            }

            const message = exported > 0 ? 
                `导出完成! 成功导出 ${exported} 个单词${skipped > 0 ? `，跳过 ${skipped} 个重复单词` : ''}` : 
                '没有新的单词需要导出';
            showMessage(message);

        } catch (err) {
            showMessage('导出失败: ' + err.message);
        } finally {
            exportBtn.disabled = false;
            exportBtn.textContent = '一键导出所有单词到 Anki';
            setTimeout(() => {
                progressDiv.style.display = 'none';
            }, 3000);
        }
    }

    // 显示消息提示
    function showMessage(msg) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'alert alert-info';
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '9999';
        messageDiv.textContent = msg;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // 确保在文档加载完成后添加事件监听
    document.addEventListener('DOMContentLoaded', function() {
        // ... 其他初始化代码 ...
        
        // Anki 导相关
        const enableAnkiExport = document.getElementById('enableAnkiExport');
        const autoExportToAnki = document.getElementById('autoExportToAnki');
        const exportToAnki = document.getElementById('exportToAnki');
        const ankiSettingsDetails = document.getElementById('ankiSettingsDetails');
        
        // 初始化时检查 Anki 设置状态
        chrome.storage.local.get(['ankiSettings'], function(result) {
            const ankiSettings = result.ankiSettings || { 
                enabled: false,
                autoExport: false 
            };
            
            enableAnkiExport.checked = ankiSettings.enabled;
            autoExportToAnki.checked = ankiSettings.autoExport;
            exportToAnki.disabled = !ankiSettings.enabled;
            ankiSettingsDetails.style.display = ankiSettings.enabled ? 'block' : 'none';
            autoExportToAnki.disabled = !ankiSettings.enabled;
        });

        // 监听 Anki 启用状态变化
        enableAnkiExport.addEventListener('change', async function(e) {
            const enabled = e.target.checked;
            
            // 更新界面状态
            exportToAnki.disabled = !enabled;
            ankiSettingsDetails.style.display = enabled ? 'block' : 'none';
            autoExportToAnki.disabled = !enabled;
            
            // 如果禁用了 Anki 导出，同时也禁用自动导出
            if (!enabled) {
                autoExportToAnki.checked = false;
            }

            // 保存设置
            const settings = await chrome.storage.local.get(['ankiSettings']);
            const ankiSettings = settings.ankiSettings || {};
            ankiSettings.enabled = enabled;
            ankiSettings.autoExport = enabled ? autoExportToAnki.checked : false;
            await chrome.storage.local.set({ ankiSettings });
        });

        // 监听自动导出状态变化
        autoExportToAnki.addEventListener('change', async function(e) {
            const autoExport = e.target.checked;
            
            // 保存设置
            const settings = await chrome.storage.local.get(['ankiSettings']);
            const ankiSettings = settings.ankiSettings || {};
            ankiSettings.autoExport = autoExport;
            await chrome.storage.local.set({ ankiSettings });
        });

        // 导出按钮事件监听
        if (exportToAnki) {
            exportToAnki.addEventListener('click', exportAllToAnki);
        }

        // 在 DOMContentLoaded 事件处理中修改
        const enablePageHighlight = document.getElementById('enablePageHighlight');

        // 加载设置
        chrome.storage.local.get(['highlightSettings'], function(result) {
            const settings = result.highlightSettings || { enabled: true };  // 默认为 true
            enablePageHighlight.checked = settings.enabled;
            
            // 如果是首次加载，保存默认设置
            if (!result.highlightSettings) {
                chrome.storage.local.set({
                    highlightSettings: { enabled: true }
                });
            }
        });

        // 保存设置
        enablePageHighlight.addEventListener('change', function(e) {
            const enabled = e.target.checked;
            chrome.storage.local.set({
                highlightSettings: { enabled }
            });
            
            // 通知所有标签页刷新高亮状态
            chrome.tabs.query({}, function(tabs) {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'updateHighlightSettings',
                        enabled: enabled
                    }).catch(() => {});  // 忽略不支持的标签页错误
                });
            });
        });
    });
} (this, document, jQuery));