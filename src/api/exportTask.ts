import ankiConnectClient from './ankiConnectClient';
import { API } from './api';
import { TopicResourceV2, MeanInfo } from './types';
import { AddNoteParams } from './ankiConnectClient';
import { groupChineseMeanings } from '../utils';

const defaultModelName = 'baicizhan-helper-model-2.1.0';
const defaultCreateModelParams = {
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
};

class ExportTask {
    private deckName: string;
    private totalWords: { topicId: number, word: string }[];
    private processedWords: number;
    private isExporting: boolean;

    constructor() {
        this.deckName = '';
        this.totalWords = [];
        this.processedWords = 0;
        this.isExporting = false;
    }

    async preprocess(deckName: string, wordTopicIds: { topicId: number, word: string }[]) {
        if (wordTopicIds.length === 0) {
            throw new Error('没有要导出的单词');
        }

        const version = await ankiConnectClient.version();
        console.log('AnkiConnect version:', version);

        // 2. 查询对应的模板是否存在，没有则创建默认模板
        const modelNames = await ankiConnectClient.modelNames();
        if (!modelNames.includes(defaultModelName)) {
            await ankiConnectClient.createModel(defaultModelName, defaultCreateModelParams.inOrderFields, defaultCreateModelParams.css, defaultCreateModelParams.cardTemplates);
        }

        // 3. 查询对应的牌组是否存在，没有则报错
        const deckNames = await ankiConnectClient.deckNames();
        if (!deckNames.includes(deckName)) {
            throw new Error(`牌组 "${deckName}" 不存在，请在 Anki 中创建该牌组`);
        }

        // 4. 查询单词明细，拼接对应的卡片信息，调用 addNote 接口添加到 anki
        const existWordsInDeck = await findExistWordsInDeck(deckName);

        this.totalWords = wordTopicIds.filter(w => !existWordsInDeck.includes(w.word));
        this.processedWords = 0;
        this.deckName = deckName;

        return {
            all: wordTopicIds.length,
            total: this.totalWords.length,
            prcoessed: this.processedWords
        }
    }

    async doExport() {
        this.isExporting = true;

        for (let i = 0; i < this.totalWords.length; i++) {
            if (!this.isExporting) {
                break;
            }

            const word = await API.getWordDetail(this.totalWords[i].topicId);
            this.processedWords++;

            const noteData = {
                deckName: this.deckName,
                modelName: defaultModelName,
                fields: {
                    Front: buildFrontContent(word),
                    Back: buildBackContent(word)
                },
                options: {
                    allowDuplicate: false,
                    duplicateScope: "deck"
                },
                tags: ["BaiCiZhan"]
            };

            const baseUrl = 'https://7n.bczcdn.com';
            const imageUrl = word.dict.sentences?.[0]?.img_uri ? `${baseUrl}${word.dict.sentences[0].img_uri}` : '';
            const sentenceAudioUrl = word.dict.sentences?.[0]?.audio_uri ? `${baseUrl}${word.dict.sentences[0].audio_uri}` : '';
            const audioUkUrl = `${baseUrl}${word.dict.word_basic_info.accent_uk_audio_uri}`;
            const audioUsaUrl = word.dict.word_basic_info.accent_usa_audio_uri ? `${baseUrl}${word.dict.word_basic_info.accent_usa_audio_uri}` : '';
            
            addImageToNote(noteData, word.dict.word_basic_info.word, imageUrl);
            addAudioToNote(noteData, word.dict.word_basic_info.word, audioUkUrl, audioUsaUrl, sentenceAudioUrl);

            await ankiConnectClient.addNote(noteData);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    getProgress() {
        return {
            total: this.totalWords.length,
            processed: this.processedWords
        }
    }

    stop() {
        this.isExporting = false;
        this.processedWords = 0;
        this.totalWords = [];
        this.deckName = '';
    }
}

/**
   * 查找指定牌组中已存在的单词列表
   * @param deckName 牌组名称
   * @returns 单词文本列表
   */
async function findExistWordsInDeck(deckName: string): Promise<string[]> {
    // 获取所有笔记的ID
    const noteIds = await ankiConnectClient.findNotes(`deck:"${deckName}"`);

    if (!noteIds || noteIds.length === 0) {
        return [];
    }

    // 获取笔记的详细信息
    const notesInfo = await ankiConnectClient.notesInfo(noteIds);

    const wordsInDeck: string[] = [];
    notesInfo.forEach(note => {
        const match = note.fields.Front?.value.match(/<div class="word">(.*?)<\/div>/);
        if (match) {
            const word = match[1].trim().toLowerCase();
            if (!wordsInDeck.includes(word)) {
                wordsInDeck.push(word);
            }
        }
    });

    return wordsInDeck;
}

// 构建前面内容（单词和音标）
function buildFrontContent(word: TopicResourceV2): string {
    let front = `<div class="word">${word.dict.word_basic_info.word}</div>`;
    if (word.dict.word_basic_info.accent_uk) {
        front += `<div class="phonetic">${word.dict.word_basic_info.accent_uk}</div>`;
    }
    return front;
}

// 构建背面内容（释义和例句）
function buildBackContent(word: TopicResourceV2): string {
    let back = '';

    // 添加释义
    if (word.dict.chn_means && Array.isArray(word.dict.chn_means)) {
        back += buildMeaningContent(word.dict.chn_means);
    }

    // 添加例句
    if (word.dict.sentences && word.dict.sentences.length > 0) {
        const sentence = word.dict.sentences[0];
        back += `
            <div class="sentence">${sentence.sentence}</div>
            <div class="sentence-trans">${sentence.sentence_trans}</div>
        `;
    }

    return back;
}

// 构建释义内容
function buildMeaningContent(meaning: MeanInfo[]): string {
    const meansByType = groupChineseMeanings(meaning);

    let backContent = '<div class="meanings">';
    meansByType.forEach((means, type) => {
        backContent += `<div class="meaning-group">
            <span class="meaning-type">${type}</span>
            <span class="meaning-content">${means.join('，')}</span>
        </div>`;
    });
    backContent += '</div>';

    return backContent;
}

function addImageToNote(note: AddNoteParams, word: string, image: string) {
    if (image) {
        let fileExtension = getFileExtensionFromUrl(image);
        note.picture = [{
            url: image,
            filename: `${word}.${fileExtension}`,
            fields: ["Image"]
        }];
        note.fields.Image = `${word}.${fileExtension}`;
    }
}

function addAudioToNote(note: AddNoteParams, word: string, audioUkUrl: string, audioUsaUrl: string, sentenceAudioUrl: string) {
    note.audio = [];

    if (audioUkUrl) {
        note.audio.push({
            url: audioUkUrl,
            filename: `${word}-uk.${getFileExtensionFromUrl(audioUkUrl)}`,
            fields: ["Audio"]
        });
    }

    if (audioUsaUrl) {
        note.audio.push({
            url: audioUsaUrl,
            filename: `${word}-usa.${getFileExtensionFromUrl(audioUsaUrl)}`,
            fields: ["Audio"]
        });
    }

    if (sentenceAudioUrl) {
        note.audio.push({
            url: sentenceAudioUrl,
            filename: `${word}-sentence.${getFileExtensionFromUrl(sentenceAudioUrl)}`,
            fields: ["SentenceAudio"]
        });
    }
}

function getFileExtensionFromUrl(url: string) {
    const match = url.match(/\.(\w+)$/);
    return match ? match[1] : '';
}

const exportTask = new ExportTask();
export default exportTask;