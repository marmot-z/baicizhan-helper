; (function (window) {
    'use strict';

    const modelName = 'BaiCiZhan-Basic-v1.23';

    class AnkiService {
        constructor() {
            this.apiUrl = 'http://127.0.0.1:8765';
        }

        async invoke(action, params = {}) {
            try {
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

        async createModelIfAbsent() {
            const models = await this.invoke('modelNames');

            if (models.includes(modelName)) {
                return Promise.resolve();
            }

            await this.invoke('createModel', {
                modelName: modelName,
                inOrderFields: ['Front', 'Back', 'Audio', 'Image', 'SentenceAudio', 'Other'],
                css: `.card{font-family:arial;font-size:20px;text-align:center;padding:20px;}.card.night_mode{background-color:#2f2f31;color:#ffffff;}.word{font-size:32px;font-weight:bold;margin-bottom:10px;color:#2196F3;}.phonetic{color:#888;margin-bottom:20px;font-size:18px;}.front-image{max-width:80%;margin:15px auto;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.2);}.meanings{margin:20px 0;text-align:left;}.meaning-group{margin:10px 0;line-height:1.5;}.meaning-type{display:inline-block;color:white;background-color:#666;padding:2px 8px;border-radius:3px;margin-right:10px;font-size:14px;}.meaning-content{color:inherit;}.sentence{font-style:italic;margin:15px 0;text-align:left;line-height:1.5;padding:10px;background-color:rgba(128,128,128,0.1);border-radius:5px;color:inherit;}.sentence-trans{color:#888;margin:10px 0 20px;text-align:left;}hr{margin:20px 0;border:none;border-top:1px solid rgba(128,128,128,0.2);}.variants,.phrases,.synonyms,.antonyms,.en-means{margin:15px 0;padding:10px;border-top:1px solid rgba(128,128,128,0.2);}.variants h4,.phrases h4,.synonyms h4,.antonyms h4,.en-means h4{font-size:18px;color:#666;margin-bottom:10px;}.variant-type{color:#666;margin-right:8px;}.phrase{margin:8px 0;}.phrase-trans{color:#666;margin-left:20px;font-size:0.9em;}.en-meaning-group{margin:8px 0;}.en-meaning-content{margin-left:20px;line-height:1.4;}.extra-section{margin:25px 0;padding:15px;background:rgba(128,128,128,0.05);border-radius:8px;text-align:left;}.extra-section h4{font-size:16px;color:#2196F3;margin-bottom:15px;padding-bottom:8px;border-bottom:1px solid rgba(128,128,128,0.2);}.variants{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;}.variant-item{display:flex;align-items:center;padding:5px 0;}.variant-type{display:inline-block;color:white;background-color:#607D8B;padding:2px 8px;border-radius:3px;margin-right:10px;font-size:13px;min-width:60px;text-align:center;}.variant-word{color:inherit;font-weight:500;}.phrases .phrase{margin:12px 0;padding:8px;border-radius:5px;transition:background-color 0.2s;}.phrases .phrase:hover{background-color:rgba(128,128,128,0.1);}.phrase-text{color:inherit;font-weight:500;margin-bottom:4px;}.phrase-trans{color:#666;font-size:0.9em;margin-left:15px;}.synonyms,.antonyms{line-height:1.6;}.word-group{display:inline-block;margin:5px 8px;padding:3px 10px;background-color:rgba(128,128,128,0.1);border-radius:15px;transition:background-color 0.2s;}.word-group:hover{background-color:rgba(128,128,128,0.2);}.en-means .en-meaning-group{margin:12px 0;padding:8px;border-radius:5px;}.en-meaning-group .meaning-type{display:inline-block;color:white;background-color:#795548;padding:2px 8px;border-radius:3px;margin-bottom:8px;font-size:13px;}.en-meaning-content{margin-left:15px;line-height:1.5;color:inherit;}`,
                cardTemplates: [
                    {
                        Name: 'Card 1',
                        Front: `
                            {{Front}}                            
                            {{Audio}}
                        `,
                        Back: `
                            {{Front}}
                            {{Audio}}
                            <hr>                          
                            {{Back}}
                            {{SentenceAudio}}                            
                            {{#Image}}
                            <div class="front-image">
                                <img src="{{text:Image}}">
                            </div>
                            {{/Image}}
                            {{Other}}
                        `
                    }
                ]
            });

            return modelName;
        }

        async addNote(noteOptions) {
            try {
                const ankiSettings = await this.getAnkiSettings();

                if (!ankiSettings.enabled) return;

                await this.ensureAnkiConnection();
                await this.ensureDeckAndModelExist(ankiSettings.deckName);

                const front = this.buildFrontContent(noteOptions.word, noteOptions.phonetic, ankiSettings);
                const back = this.buildBackContent(noteOptions.meaning, noteOptions.sentence, noteOptions.sentenceTrans, ankiSettings);
                const other = this.buildOtherContent(noteOptions.variants,
                    noteOptions.shortPhrases, noteOptions.synonyms, noteOptions.antonyms, noteOptions.enMeans, ankiSettings);
                const note = this.buildNoteObject(ankiSettings.deckName,
                    front, back, other, noteOptions.word, noteOptions.image, noteOptions.audioUkUrl, noteOptions.audioUsaUrl, noteOptions.sentenceAudioUrl, ankiSettings);

                console.log('Adding note:', note);

                await this.addNoteToAnki(note);

                return true;
            } catch (error) {
                console.error('Error in addNote:', error);

                if (error.message.includes('duplicate')) {
                    return true;
                }

                throw error;
            }
        }

        async getAnkiSettings() {
            const settings = await chrome.storage.local.get(['ankiSettings']);
            return settings.ankiSettings || {
                enabled: false,
                autoExport: true,
                deckName: 'English Vocabulary',
                exportPhonetic: true,
                exportAudio: true,
                exportMeaning: true,
                exportSentence: true,
                exportVariants: true,
                exportPhrases: true,
                exportSynonyms: true,
                exportAntonyms: true,
                exportEnMeans: true
            };
        }

        async ensureAnkiConnection() {
            try {
                await this.invoke('version');
            } catch (error) {
                throw new Error('连接失败。请确保：\n1. Anki 正在运行\n2. AnkiConnect 插件已安装\n3. 重启 Anki 后再试');
            }
        }

        async ensureDeckAndModelExist(deckName) {
            const decks = await this.invoke('deckNames');
            if (!decks.includes(deckName)) {
                await this.createDeck(deckName);
            }

            await this.createModelIfAbsent();
        }

        buildFrontContent(word, phonetic, ankiSettings) {
            let front = `<div class="word">${word}</div>`;
            if (ankiSettings.exportPhonetic) {
                front += `<div class="phonetic">${phonetic}</div>`;
            }
            return front;
        }

        buildBackContent(meaning, sentence, sentenceTrans, ankiSettings) {
            let back = '';

            if (ankiSettings.exportMeaning && Array.isArray(meaning)) {
                back += this.buildMeaningContent(meaning);
            }

            if (ankiSettings.exportSentence && sentence) {
                back += `
                    <div class="sentence">${sentence}</div>
                    <div class="sentence-trans">${sentenceTrans}</div>
                `;
            }

            return back;
        }

        buildMeaningContent(meaning) {
            let content = '<div class="meanings">';
            const meaningsByType = meaning.reduce((groups, m) => {
                if (!groups[m.type]) {
                    groups[m.type] = [];
                }
                groups[m.type].push(m.mean);
                return groups;
            }, {});

            Object.entries(meaningsByType).forEach(([type, means]) => {
                content += `<div class="meaning-group">
                    <span class="meaning-type">${type}</span>
                    <span class="meaning-content">${means.join('，')}</span>
                </div>`;
            });
            content += '</div>';
            return content;
        }

        buildOtherContent(variants, shortPhrases, synonyms, antonyms, enMeans, ankiSettings) {
            let other = '';

            if (ankiSettings.exportPhrases && shortPhrases && shortPhrases.length > 0) {
                other += this.buildShortPhrasesContent(shortPhrases);
            }

            if (ankiSettings.exportSynonyms && synonyms && synonyms.length > 0) {
                other += this.buildSynonymsContent(synonyms);
            }

            if (ankiSettings.exportAntonyms && antonyms && antonyms.length > 0) {
                other += this.buildAntonymsContent(antonyms);
            }

            if (ankiSettings.exportVariants && variants) {
                other += this.buildVariantsContent(variants);
            }

            if (ankiSettings.exportEnMeans && enMeans && enMeans.length > 0) {
                other += this.buildEnMeansContent(enMeans);
            }

            return other;
        }

        buildShortPhrasesContent(shortPhrases) {
            let content = `
                    <div class="extra-section">
                    <h4>常用短语</h4>
                    <div class="phrases">`;
            shortPhrases.forEach(phrase => {
                content += `<div class="phrase">
                        <div class="phrase-text">${phrase.short_phrase}</div>
                        <div class="phrase-trans">${phrase.short_phrase_trans}</div>
                    </div>`;
            });
            content += '</div></div>';
            return content;
        }

        buildSynonymsContent(synonyms) {
            let content = `
                <div class="extra-section">
                    <h4>近义词</h4>
                    <div class="synonyms">
            `;
            synonyms.forEach(s => {
                content += `<span class="word-group">${s.syn_ant}</span>`;
            });
            content += '</div></div>';
            return content;
        }

        buildAntonymsContent(antonyms) {
            let content = `
                <div class="extra-section">
                    <h4>反义词</h4>
                    <div class="antonyms">`;
            antonyms.forEach(a => {
                content += `<span class="word-group">${a.syn_ant}</span>`;
            });
            content += '</div></div>';
            return content;
        }

        buildVariantsContent(variants) {
            let content = `
                <div class="extra-section">
                    <h4>单词变形</h4>
                    <div class="variants">
            `;
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
                    content += `
                        <div class="variant-item">
                            <span class="variant-type">${variantTypes[key]}</span>
                            <span class="variant-word">${value}</span>
                        </div>
                    `;
                }
            });
            content += '</div></div>';
            return content;
        }

        buildEnMeansContent(enMeans) {
            let content = `<div class="extra-section">
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
                content += `
                    <div class="en-meaning-group">
                        <div class="meaning-type">${type}</div>
                        <div class="en-meaning-content">${means.join('; ')}</div>
                    </div>
                `;
            });
            content += '</div></div>';
            return content;
        }

        buildNoteObject(deckName, front, back, other, word, image, audioUkUrl, audioUsaUrl, sentenceAudioUrl, ankiSettings) {
            const note = {
                deckName: deckName,
                modelName: modelName,
                fields: {
                    Front: front,
                    Back: back,
                    Audio: '',
                    Image: '',
                    SentenceAudio: '',
                    Other: other
                },
                options: {
                    allowDuplicate: false,
                    duplicateScope: "deck"
                },
                tags: ["BaiCiZhan"]
            };

            this.addImageToNote(note, word, image, ankiSettings);
            this.addAudioToNote(note, word, audioUkUrl, audioUsaUrl, sentenceAudioUrl, ankiSettings);

            return note;
        }

        addImageToNote(note, word, image, ankiSettings) {
            if (image && ankiSettings.exportSentence) {
                let fileExtension = this.getFileExtensionFromUrl(image);
                note.picture = [{
                    url: image,
                    filename: `${word}.${fileExtension}`,
                    fields: ["Image"]
                }];
                note.fields.Image = `${word}.${fileExtension}`;
            }
        }

        addAudioToNote(note, word, audioUkUrl, audioUsaUrl, sentenceAudioUrl, ankiSettings) {
            note.audio = [];

            if (audioUkUrl) {
                note.audio.push({
                    url: audioUkUrl,
                    filename: `${word}-uk.${this.getFileExtensionFromUrl(audioUkUrl)}`,
                    fields: ["Audio"]
                });
            }

            if (audioUsaUrl) {
                note.audio.push({
                    url: audioUsaUrl,
                    filename: `${word}-usa.${this.getFileExtensionFromUrl(audioUsaUrl)}`,
                    fields: ["Audio"]
                });
            }

            if (sentenceAudioUrl && ankiSettings.exportSentence) {
                note.audio.push({
                    url: sentenceAudioUrl,
                    filename: `${word}-sentence.${this.getFileExtensionFromUrl(sentenceAudioUrl)}`,
                    fields: ["SentenceAudio"]
                });
            }
        }

        async addNoteToAnki(note) {
            try {
                const result = await this.invoke('addNote', { note });
            } catch (error) {
                if (error.message.includes('duplicate')) {
                    console.log('Word already exists in Anki:', note.fields.Front);
                    return true;
                }
                throw error;
            }
        }

        getFileExtensionFromUrl(url) {
            const match = url.match(/\.(\w+)$/);
            return match ? match[1] : 'mp3';
        }

        // 在 AnkiService 类中添加新方法
        async findNotesInDeck(deckName) {
            try {
                // 构建查询字符串
                const query = `deck:"${deckName}"`;

                // 获取所有笔记的ID
                const noteIds = await this.invoke('findNotes', {
                    query: query
                });

                if (!noteIds || noteIds.length === 0) {
                    return new Set();
                }

                // 获取笔记的详细信息
                const notesInfo = await this.invoke('notesInfo', {
                    notes: noteIds
                });

                // 提取所有单词并转换为小写存入Set
                const wordsInDeck = new Set();
                notesInfo.forEach(note => {
                    // 从Front字段提取单词
                    const match = note.fields.Front.value.match(/<div class="word">(.*?)<\/div>/);
                    if (match) {
                        const word = match[1].trim().toLowerCase();
                        wordsInDeck.add(word);
                    }
                });

                return wordsInDeck;
            } catch (error) {
                console.error('Error getting notes from deck:', error);
                throw error;
            }
        }
    }

    window.AnkiService = AnkiService;
})(window);