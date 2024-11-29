;(function(window) {
    'use strict';

    class AnkiService {
        constructor() {
            this.apiUrl = 'http://127.0.0.1:8765';
        }

        async invoke(action, params = {}) {
            try {
                // 通过 background 发送请求
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage({
                        type: 'ankiConnect',
                        params: {
                            action,
                            version: 6,
                            params,
                            key: null
                        }
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            reject(new Error(chrome.runtime.lastError.message));
                            return;
                        }
                        if (!response.success) {
                            reject(new Error(response.error));
                            return;
                        }
                        resolve(response.data);
                    });
                });

                if (response.error) {
                    throw new Error(response.error);
                }
                return response.result;
            } catch (error) {
                console.error('AnkiConnect request failed:', error);
                if (error.message.includes('Failed to fetch')) {
                    throw new Error('连接失败。请确保：\n1. Anki 正在运行\n2. AnkiConnect 插件已安装\n3. 重启 Anki 后再试');
                }
                throw error;
            }
        }

        async createDeck(deckName) {
            return this.invoke('createDeck', {
                deck: deckName
            });
        }

        async createBasicModel() {
            const modelName = 'BaiCiZhan Basic';
            const result = await this.invoke('createModel', {
                modelName: modelName,
                inOrderFields: ['Front', 'Back', 'Audio', 'Image'],
                css: `.card {
                    font-family: arial;
                    font-size: 20px;
                    text-align: center;
                    padding: 20px;
                }
                
                /* 适配暗黑模式 */
                .card.night_mode {
                    background-color: #2f2f31;
                    color: #ffffff;
                }
                
                .word {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #2196F3;
                }
                
                .phonetic {
                    color: #888;
                    margin-bottom: 20px;
                    font-size: 18px;
                }
                
                .front-image {
                    max-width: 80%;
                    margin: 15px auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                }
                
                .meanings {
                    margin: 20px 0;
                    text-align: left;
                }
                
                .meaning-group {
                    margin: 10px 0;
                    line-height: 1.5;
                }
                
                .meaning-type {
                    display: inline-block;
                    color: white;
                    background-color: #666;
                    padding: 2px 8px;
                    border-radius: 3px;
                    margin-right: 10px;
                    font-size: 14px;
                }
                
                .meaning-content {
                    color: inherit;  /* 使用继承的颜色，适配暗黑模式 */
                }
                
                .sentence {
                    font-style: italic;
                    margin: 15px 0;
                    text-align: left;
                    line-height: 1.5;
                    padding: 10px;
                    background-color: rgba(128, 128, 128, 0.1);  /* 使用半透明背景，适配暗黑模式 */
                    border-radius: 5px;
                    color: inherit;  /* 使用继承的颜色 */
                }
                
                .sentence-trans {
                    color: #888;
                    margin: 10px 0 20px;
                    text-align: left;
                }
                
                hr {
                    margin: 20px 0;
                    border: none;
                    border-top: 1px solid rgba(128, 128, 128, 0.2);  /* 使用半透明边框 */
                }
                
                .variants, .phrases, .synonyms, .antonyms, .en-means {
                    margin: 15px 0;
                    padding: 10px;
                    border-top: 1px solid rgba(128, 128, 128, 0.2);
                }

                .variants h4, .phrases h4, .synonyms h4, .antonyms h4, .en-means h4 {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 10px;
                }

                .variant-type {
                    color: #666;
                    margin-right: 8px;
                }

                .phrase {
                    margin: 8px 0;
                }

                .phrase-trans {
                    color: #666;
                    margin-left: 20px;
                    font-size: 0.9em;
                }

                .en-meaning-group {
                    margin: 8px 0;
                }

                .en-meaning-content {
                    margin-left: 20px;
                    line-height: 1.4;
                }

                /* 额外信息的通用样式 */
                .extra-section {
                    margin: 25px 0;
                    padding: 15px;
                    background: rgba(128, 128, 128, 0.05);
                    border-radius: 8px;
                    text-align: left;
                }

                .extra-section h4 {
                    font-size: 16px;
                    color: #2196F3;
                    margin-bottom: 15px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(128, 128, 128, 0.2);
                }

                /* 单词变形样式 */
                .variants {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 10px;
                }

                .variant-item {
                    display: flex;
                    align-items: center;
                    padding: 5px 0;
                }

                .variant-type {
                    display: inline-block;
                    color: white;
                    background-color: #607D8B;
                    padding: 2px 8px;
                    border-radius: 3px;
                    margin-right: 10px;
                    font-size: 13px;
                    min-width: 60px;
                    text-align: center;
                }

                .variant-word {
                    color: inherit;
                    font-weight: 500;
                }

                /* 短语样式 */
                .phrases .phrase {
                    margin: 12px 0;
                    padding: 8px;
                    border-radius: 5px;
                    transition: background-color 0.2s;
                }

                .phrases .phrase:hover {
                    background-color: rgba(128, 128, 128, 0.1);
                }

                .phrase-text {
                    color: inherit;
                    font-weight: 500;
                    margin-bottom: 4px;
                }

                .phrase-trans {
                    color: #666;
                    font-size: 0.9em;
                    margin-left: 15px;
                }

                /* 近义词和反义词样式 */
                .synonyms, .antonyms {
                    line-height: 1.6;
                }

                .word-group {
                    display: inline-block;
                    margin: 5px 8px;
                    padding: 3px 10px;
                    background-color: rgba(128, 128, 128, 0.1);
                    border-radius: 15px;
                    transition: background-color 0.2s;
                }

                .word-group:hover {
                    background-color: rgba(128, 128, 128, 0.2);
                }

                /* 英文释义样式 */
                .en-means .en-meaning-group {
                    margin: 12px 0;
                    padding: 8px;
                    border-radius: 5px;
                }

                .en-meaning-group .meaning-type {
                    display: inline-block;
                    color: white;
                    background-color: #795548;
                    padding: 2px 8px;
                    border-radius: 3px;
                    margin-bottom: 8px;
                    font-size: 13px;
                }

                .en-meaning-content {
                    margin-left: 15px;
                    line-height: 1.5;
                    color: inherit;
                }`,
                cardTemplates: [
                    {
                        Name: 'Card 1',
                        Front: `
                            {{Front}}
                            {{#Image}}
                            <div class="front-image">
                                <img src="{{text:Image}}">
                            </div>
                            {{/Image}}
                            {{Audio}}
                        `,
                        Back: `
                            {{Front}}
                            <hr>
                            {{Back}}
                            {{Audio}}
                            {{#Image}}
                            <div class="front-image">
                                <img src="{{text:Image}}">
                            </div>
                            {{/Image}}
                        `
                    }
                ]
            });
            return modelName;
        }

        async addNote(word, phonetic, meaning, image, sentence, sentenceTrans, audioUrl, variants, shortPhrases, synonyms, antonyms, enMeans) {
            try {
                // 首先检查是否启用了 Anki 导出功能
                const settings = await chrome.storage.local.get(['ankiSettings']);
                const ankiSettings = settings.ankiSettings || {
                    enabled: false,
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

                // 如果功能未启用，直接返回
                if (!ankiSettings.enabled) {
                    return;
                }

                // 只有在功能启用时才尝试连接 Anki
                try {
                    await this.invoke('version');
                } catch (error) {
                    throw new Error('连接失败。请确保：\n1. Anki 正在运行\n2. AnkiConnect 插件已安装\n3. 重启 Anki 后再试');
                }

                // 检查牌组是否存在，不存在则创建
                const decks = await this.invoke('deckNames');
                if (!decks.includes(ankiSettings.deckName)) {
                    await this.createDeck(ankiSettings.deckName);
                }

                // 检查模板是否存在，不存在则创建
                const models = await this.invoke('modelNames');
                const modelName = 'BaiCiZhan Basic';
                if (!models.includes(modelName)) {
                    await this.createBasicModel();
                }

                // 构建正面内容
                let front = `<div class="word">${word}</div>`;
                if (ankiSettings.exportPhonetic) {
                    front += `<div class="phonetic">${phonetic}</div>`;
                }

                // 构建背面内容
                let back = '';
                
                // 添加中文释义
                if (ankiSettings.exportMeaning && Array.isArray(meaning)) {
                    back += '<div class="meanings">';
                    const meaningsByType = meaning.reduce((groups, m) => {
                        if (!groups[m.type]) {
                            groups[m.type] = [];
                        }
                        groups[m.type].push(m.mean);
                        return groups;
                    }, {});

                    Object.entries(meaningsByType).forEach(([type, means]) => {
                        back += `<div class="meaning-group">
                            <span class="meaning-type">${type}</span>
                            <span class="meaning-content">${means.join('，')}</span>
                        </div>`;
                    });
                    back += '</div>';
                }

                // 添加例句
                if (ankiSettings.exportSentence && sentence) {
                    back += `
                        <div class="sentence">${sentence}</div>
                        <div class="sentence-trans">${sentenceTrans}</div>
                    `;
                }

                // 添加单词变形
                if (ankiSettings.exportVariants && variants) {
                    back += `<div class="extra-section">
                        <h4>单词变形</h4>
                        <div class="variants">`;
                    const variantTypes = {
                        noun: '名词',
                        verb: '动词',
                        adj: '形容词',
                        adv: '副词',
                        pl: '复数',
                        est: '最高级',
                        er: '比较级',
                        done: '过去分词',
                        past: '过去式',
                        third: '第三人称'
                    };
                    
                    Object.entries(variants).forEach(([key, value]) => {
                        if (value && variantTypes[key]) {
                            back += `<div class="variant-item">
                                <span class="variant-type">${variantTypes[key]}</span>
                                <span class="variant-word">${value}</span>
                            </div>`;
                        }
                    });
                    back += '</div></div>';
                }

                // 添加短语
                if (ankiSettings.exportPhrases && shortPhrases && shortPhrases.length > 0) {
                    back += `<div class="extra-section">
                        <h4>常用短语</h4>
                        <div class="phrases">`;
                    shortPhrases.forEach(phrase => {
                        back += `<div class="phrase">
                            <div class="phrase-text">${phrase.short_phrase}</div>
                            <div class="phrase-trans">${phrase.short_phrase_trans}</div>
                        </div>`;
                    });
                    back += '</div></div>';
                }

                // 添加近义词
                if (ankiSettings.exportSynonyms && synonyms && synonyms.length > 0) {
                    back += `<div class="extra-section">
                        <h4>近义词</h4>
                        <div class="synonyms">`;
                    synonyms.forEach(s => {
                        back += `<span class="word-group">${s.syn_ant}</span>`;
                    });
                    back += '</div></div>';
                }

                // 添加反义词
                if (ankiSettings.exportAntonyms && antonyms && antonyms.length > 0) {
                    back += `<div class="extra-section">
                        <h4>反义词</h4>
                        <div class="antonyms">`;
                    antonyms.forEach(a => {
                        back += `<span class="word-group">${a.syn_ant}</span>`;
                    });
                    back += '</div></div>';
                }

                // 添加英文释义
                if (ankiSettings.exportEnMeans && enMeans && enMeans.length > 0) {
                    back += `<div class="extra-section">
                        <h4>英文释义</h4>
                        <div class="en-means">`;
                    const enMeansByType = enMeans.reduce((groups, m) => {
                        if (!groups[m.mean_type]) {
                            groups[m.mean_type] = [];
                        }
                        groups[m.mean_type].push(m.mean);
                        return groups;
                    }, {});

                    Object.entries(enMeansByType).forEach(([type, means]) => {
                        back += `<div class="en-meaning-group">
                            <div class="meaning-type">${type}</div>
                            <div class="en-meaning-content">${means.join('; ')}</div>
                        </div>`;
                    });
                    back += '</div></div>';
                }

                const note = {
                    deckName: ankiSettings.deckName,
                    modelName: modelName,
                    fields: {
                        Front: front,
                        Back: back,
                        Audio: '',
                        Image: ''
                    },
                    options: {
                        allowDuplicate: false
                    },
                    tags: ["BaiCiZhan"]
                };

                // 处理图片
                if (ankiSettings.exportImage && image) {
                    try {
                        // 先下载图片
                        const response = await fetch(image);
                        if (!response.ok) {
                            throw new Error('Failed to fetch image');
                        }
                        const blob = await response.blob();
                        const base64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(blob);
                        });

                        // 添加图片到笔记
                        note.picture = [{
                            data: base64,
                            filename: `${word}.jpg`,
                            fields: ["Image"]
                        }];

                        // 设置 Image 字段的值为文件名
                        note.fields.Image = `${word}.jpg`;
                    } catch (error) {
                        console.error('Failed to process image:', error);
                        // 如果图片处理失败，保持 Image 字段为空
                    }
                }

                // 处理音频
                if (ankiSettings.exportAudio && audioUrl) {
                    try {
                        const audioResponse = await fetch(audioUrl);
                        if (!audioResponse.ok) {
                            throw new Error('Failed to fetch audio');
                        }
                        const audioBlob = await audioResponse.blob();
                        const audioBase64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result.split(',')[1]);
                            reader.readAsDataURL(audioBlob);
                        });

                        // 添加音频到笔记
                        note.audio = [{
                            data: audioBase64,
                            filename: `${word}.mp3`,
                            fields: ["Audio"]
                        }];

                        // 更新音频字段
                        note.fields.Audio = `[sound:${word}.mp3]`;
                    } catch (error) {
                        console.error('Failed to process audio:', error);
                    }
                }

                console.log('Adding note:', note); // 添加调试日志

                // 添加笔记
                try {
                    const result = await this.invoke('addNote', { note });
                    return result;
                } catch (error) {
                    // 如果是重复单词的错误，我们不把它当作错误处理
                    if (error.message.includes('duplicate')) {
                        console.log('Word already exists in Anki:', word);
                        return true;  // 返回成功，因为单词已经在 Anki 中了
                    }
                    throw error;  // 其他错误继续抛出
                }
            } catch (error) {
                console.error('Error in addNote:', error);
                // 如果不是重复单词的错误，才抛出
                if (!error.message.includes('duplicate')) {
                    throw error;
                }
                return true;  // 重复单词返回成功
            }
        }

        async canAddNote(word, phonetic, meaning) {
            const note = {
                deckName: "English Vocabulary",
                modelName: "Basic",
                fields: {
                    Front: `${word}\n${phonetic}`,
                    Back: meaning
                }
            };

            const result = await this.invoke('canAddNotes', {
                notes: [note]
            });
            return result[0];
        }

        async getModelNames() {
            return this.invoke('modelNames');
        }
    }

    window.AnkiService = AnkiService;
})(window); 