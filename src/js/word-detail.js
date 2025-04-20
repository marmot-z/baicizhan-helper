;(function(window, document, $) {
    'use strict';

    const {collectWord, cancelCollectWord} = window.apiModule;
    const {highlightSentence} = window.utilModule;
    const resourceDomain = 'https://7n.bczcdn.com';
    const $doc = $(document);
    let collected = false;

    function generateWordDetail(data, $target, hasCollected, collectEnable = true) {
        $target.empty().css('display', 'block');
        collected = hasCollected || false;
        
        storageModule.get(['wordDetail', 'collectShortcutkey'])
            .then(([wordDetailSettings, collectShortcutkey]) => {
                const settings = wordDetailSettings || {
                    variantDisplay: false,
                    sentenceDisplay: true,
                    shortPhrasesDisplay: false,
                    synonymsDisplay: false,
                    antonymsDisplay: false,
                    similarWordsDisplay: false,
                    englishParaphraseDisplay: false,
                    autoPlayAudio: true                
                };

                generateWordInfo(data.dict, $target, collectEnable, collectShortcutkey);
                if (settings.variantDisplay) generateVariant(data.dict.variant_info, $target, true);
                if (settings.sentenceDisplay) generateSentence(data.dict.sentences, data.dict.word_basic_info.word, $target);
                if (settings.shortPhrasesDisplay) generateShortPhrases(data.dict.short_phrases, $target);                 
                if (settings.synonymsDisplay) generateSynonyms(data.dict.synonyms, $target, true);
                if (settings.antonymsDisplay) generateAntonyms(data.dict.antonyms, $target, true);
                if (settings.similarWordsDisplay) generateSimilarWords(data.similar_words, $target, true);
                if (settings.englishParaphraseDisplay) generateEnglishParaphrase(data.dict.en_means, $target);
                if (settings.autoPlayAudio) {
                    const ukAudio = $('#accentUkAudio')[0];
                    ukAudio.addEventListener('ended', () => $('#phraseAudio')[0].play());
                    ukAudio.play();
                }
            })
            .catch(error => {
                console.error('Error loading word detail settings:', error);
                window.Analytics.fireErrorEvent(error, { message: '加载单词详情失败' });
                $target.html(`<p>加载单词详情失败：${error.message}</p>`);                
            });             
    }

    function generateStudyWordDetail(data, $target) {
        collected = data.dict.word_basic_info.__collected__ || false;

        try {
            generateWordInfo(data.dict, $target, true, '');
            generateVariant(data.dict.variant_info, $target);
            generateSentence(data.dict.sentences, data.dict.word_basic_info.word, $target);
            generateShortPhrases(data.dict.short_phrases, $target);
            generateSynonyms(data.dict.synonyms, $target);
            generateAntonyms(data.dict.antonyms, $target);
            generateSimilarWords(data.similar_words, $target);
            generateEnglishParaphrase(data.dict.en_means, $target);

            storageModule.get(['wordDetail'])       
            .then(([wordDetailSettings]) => {
                const autoPlayAudio = wordDetailSettings?.autoPlayAudio;

                if (autoPlayAudio) {
                    const ukAudio = $('#accentUkAudio')[0];
                    ukAudio.addEventListener('ended', () => $('#phraseAudio')[0].play());
                    ukAudio.play();
                }
            });        
        } catch (error) {
            console.error('Error generating study word detail:', error);
            window.Analytics.fireErrorEvent(error, { message: '加载学习模块单词详情失败' });
        }
    }

    function generateWordInfo(data, $parent, collectEnable, collectShortcutkey) {
        let starIconSvg = collected ? 'star-fill.svg' : 'star.svg'; 
        let $section = $(`
            <div class="section">
                <span class="word">${data.word_basic_info.word}</span>
                <span id="copyIcon" class="copy" style="cursor: pointer; margin-left: 5px;">
                    <img src="../svgs/copy.svg" title="复制单词">
                </span>
                <span id="starIcon" class="star" style="display: ${collectEnable ? 'block' : 'none'}">
                    <img src="../svgs/${starIconSvg}">
                </span>
                <br>                
            </div>
        `);                

        generateAccent(data.word_basic_info, $section);
        generateMeansTable(data.chn_means, $section);

        $section.appendTo($parent);
        $section.find('#copyIcon').on('click', () =>
            navigator.clipboard.writeText(data.word_basic_info.word));
        $section.find('#starIcon').on('click', function(e) {
            favoriteWord.bind(this)(data)
        });

        if (collectEnable && collectShortcutkey && collectShortcutkey.trim()) {
            $doc.off('keydown')
                .on('keydown', null, collectShortcutkey.toLowerCase(), function(e) {
                    favoriteWord.bind($section.find('#starIcon')[0])(data)
                });
        }
    }

    async function exportToAnki(data) {
        try {
            const ankiService = new AnkiService();
            
            // 准备数据
            const wordData = {
                word: data.word_basic_info.word,
                phonetic: data.word_basic_info.accent_uk,
                meaning: data.chn_means.map(m => ({
                    type: m.mean_type,
                    mean: m.mean
                })),
                image: data.sentences?.[0]?.img_uri ? 
                       'https://7n.bczcdn.com' + data.sentences[0].img_uri : '',
                sentence: data.sentences?.[0]?.sentence || '',
                sentenceTrans: data.sentences?.[0]?.sentence_trans || '',
                audioUrl: 'https://7n.bczcdn.com' + data.word_basic_info.accent_uk_audio_uri,
                // 添加额外信息
                variants: data.variant_info || null,
                shortPhrases: data.short_phrases || [],
                synonyms: data.synonyms || [],
                antonyms: data.antonyms || [],
                enMeans: data.en_means || []
            };

            console.log('Prepared word data:', wordData);
            
            // 添加笔记
            await ankiService.addNote(
                wordData.word,
                wordData.phonetic,
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
            showMessage('成功导出到Anki!');
        } catch (error) {
            showMessage('导出失败：' + error.message);
            console.error('Export error:', error);
        }
    }

    function showMessage(message) {
        const $msg = $(`<div class="message">${message}</div>`);
        $('body').append($msg);
        
        setTimeout(() => {
            $msg.remove();
        }, 3000);
    }

    async function favoriteWord(data) {
        let fn = !collected ? collectWord : cancelCollectWord;
        let args = !collected ? data : data.word_basic_info.topic_id;
        let tips = !collected ? '收藏' : '取消收藏';

        try {
            const response = await fn(args);
            if (response) {
                collected = !collected;
                let starIconSvg = collected ? 'star-fill.svg' : 'star.svg';                
                $(this).html(`<img src="../svgs/${starIconSvg}">`);

                // 如果是收藏操作，检查是否启用了 Anki 导出
                if (collected) {
                    try {
                        const settings = await chrome.storage.local.get(['ankiSettings']);
                        const ankiSettings = settings?.ankiSettings || { 
                            enabled: false,
                            autoExport: true
                        };

                        if (ankiSettings.enabled && ankiSettings.autoExport) {
                            await exportToAnki(data);
                            showMessage('已收藏并同步到 Anki');
                        } else {
                            showMessage('已收藏');
                        }
                    } catch (error) {
                        console.error('Export to Anki failed:', error);
                        showMessage('已收藏，但同步到 Anki 失败：' + error.message);
                    }
                } else {
                    showMessage('已取消收藏');
                }
                return;
            }
            showMessage(`${tips}失败`);
        } catch (e) {
            console.error(`${tips}异常`, e);
            showMessage(`${tips}失败：` + e.message);
        }
    }

    function generateAccent(data, $parent) {
        let html = `
            <span class="badge bg-info" style="color: white;">英</span>
            <span>${data.accent_uk}</span>
            <span id="accentUkIcon" class="volume-up">
                <img src="../svgs/volume-up.svg">
            </span>
            <audio id="accentUkAudio" style="display: none;"><source src="${resourceDomain + data.accent_uk_audio_uri}"></audio>
        `;

        if (data.accent_uk !== data.accent_usa) {
            html += `
                <span class="badge bg-info" style="color: white;">美</span>
                <span>${data.accent_usa}</span>
                <span id="accentUsaIcon" class="volume-up">
                    <img src="../svgs/volume-up.svg">
                </span>
                <audio id="accentUsaAudio" style="display: none;"><source src="${resourceDomain + data.accent_usa_audio_uri}"></audio>
            `;
        }

        $(html).appendTo($parent);
        $parent.find('#accentUkIcon').on('click', () => $('#accentUkAudio')[0].play());
        $parent.find('#accentUsaIcon').on('click', () => $('#accentUsaAudio')[0].play());
    }

    function generateMeansTable(data, $parent) {
        let chineseMeans = data.reduce((prev, curr) => {
            prev[curr.mean_type] = prev[curr.mean_type] || [];
            prev[curr.mean_type].push(curr.mean);

            return prev;
        }, Object.create(null));
        let $el = $(`
            <table class="means-table">
                ${
                    Object.entries(chineseMeans)
                        .map(([k, v]) => `
                            <tr>
                                <td><span class="badge bg-primary" style="color: white;">${k}</span></td>
                                <td>${v.join(';')}</td>
                            </tr>
                        `)
                        .join('')
                }
            </table>
        `);  
        
        $el.appendTo($parent);
    }

    function generateSentence(data, word, $parent) {
        if (data.length === 0) return;

        let index = 0, len = data.length;
        let $el = $(`
            <div class="section">
                <p class="section-title">
                    图文例句 
                    <img class="refresh-icon" src="../svgs/refresh.svg" title="刷新例句"></img>
                </p>
                <div id="sentenceDiv">                    
                </div>
            </div>
        `);
        let $sentenceDiv = $el.find('#sentenceDiv');

        refreshSentence(data[index++ % len], word, $sentenceDiv);

        $el.appendTo($parent);
        $el.find('.refresh-icon')
            .on('click', () => refreshSentence(data[index++ % len], word, $sentenceDiv));
    }

    function refreshSentence(sentence, word, $parent) {
        let sentenceHtml = highlightSentence(sentence, word);
        let $el = $(`
            <span>${sentenceHtml}</span>
            <span id="phreaseAccentIcon" class="volume-up">
                <img src="../svgs/volume-up.svg">
            </span>
            <audio id="phraseAudio" style="display: none;"><source src="${resourceDomain + sentence.audio_uri}"></audio>
            <br>
            <p style="color: #6a6d71;">${sentence.sentence_trans}</p>
            <img style="max-width: 200px;" src="${resourceDomain + sentence.img_uri}" />
        `);

        $parent.empty().append($el);
        $parent.find('#phreaseAccentIcon')
                .on('click', () => $('#phraseAudio')[0].play());
    }

    function generateEnglishParaphrase(data, $parent) {
        if (data.length === 0) return;

        let englishMeans = data.reduce((prev, curr) => {
            prev[curr.mean_type] = prev[curr.mean_type] || [];
            prev[curr.mean_type].push(curr.mean);

            return prev;
        }, Object.create(null));
        let $el = $(`
            <div class="section">
                <p class="section-title">英文释义</p>
                ${
                    Object.entries(englishMeans)
                        .map(([k, v]) => `
                            <span class="badge bg-primary" style="color: white;">${k}</span><br>
                            <ul style="padding-left: 15px;">
                                ${v.map(m => `<li>${m}</li>`).join('')}
                            </ul>
                        `)
                        .join('')
                }
            </div>
        `);

        $el.appendTo($parent);
    }

    function generateShortPhrases(data, $parent) {
        if (data.length === 0) return;

        let $el = $(`
            <div class="section">
                <p class="section-title">短语</p>
                <ul style="padding-left: 15px;">
                ${
                    data.map(shortPhrase => `
                        <li>
                            <span>${shortPhrase.short_phrase}</span>
                            <p style="margin-bottom: 2px; color: #6a6d71;">${shortPhrase.short_phrase_trans}</p>
                        </li>
                    `)
                    .join('')
                }
                </ul>
            </div>
        `);

        $el.appendTo($parent);
    }

    function generateVariant(data, $parent, redirectable) {
        if (!data) return;

        let $el = $(`
            <div class="section">
                <p class="section-title">单词变形</p>                
            </div>
        `);

        if (data.noun) $el.append(generateVariantWord(data.noun, data.noun_topic_id, '名词', redirectable));
        if (data.verb) $el.append(generateVariantWord(data.verb, data.verb_topic_id, '动词', redirectable));
        if (data.adj) $el.append(generateVariantWord(data.adj, data.adj_topic_id, '形容词', redirectable));
        if (data.pl) $el.append(generateVariantWord(data.pl, data.pl_topic_id, '复数', redirectable));
        if (data.adv) $el.append(generateVariantWord(data.adv, data.adv_topic_id, '副词', redirectable));
        if (data.est) $el.append(generateVariantWord(data.est, data.est_topic_id, '现在分词', redirectable));
        if (data.done) $el.append(generateVariantWord(data.done, data.done_topic_id, '过去分词', redirectable));
        if (data.past) $el.append(generateVariantWord(data.past, data.past_topic_id, '过去式', redirectable));
        if (data.third) $el.append(generateVariantWord(data.third, data.thrid_topic_id, '第三人称单数', redirectable));
        if (data.er) $el.append(generateVariantWord(data.er, data.er_topic_id, '比较级', redirectable));

        $el.appendTo($parent);
    }

    function generateVariantWord(word, topicId, title, redirectable = false) {
        let $el = $(`
            <span style="color: #6a6d71;">${title}</span> &nbsp;&nbsp;
            <a href="#" tabIndex="-1" data-topic-id=${topicId}>${word}</a>
            <br>
        `);

        $($el[1]).on('click', function (e) {
            redirectable ? refreshWordDetail.call(this, e) : e.preventDefault();
        });

        return $el;
    }

    function generateAntonyms(data, $parent, redirectable = false) {
        if (!data.length) return;

        let $el = $(`
            <div class="section">
                <p class="section-title">反义词</p>
                <p class="p-words">
                ${
                    data.map(antonym => 
                        `<a href="#" tabIndex="-1" data-topic-id="${antonym.syn_ant_topic_id}">${antonym.syn_ant}</a>`
                    )
                    .join('&nbsp;&nbsp;')
                }
                </p>
            </div>
        `);

        $parent.append($el);
        $parent.find('a').on('click', function (e) {
            redirectable ? refreshWordDetail.call(this, e): e.preventDefault();
        });
    }

    function generateSynonyms(data, $parent, redirectable = false) {
        if (!data.length) return;

        let $el = $(`
            <div class="section">
                <p class="section-title">近义词</p>
                <p class="p-words">
                ${
                    data.map(synonym => 
                        `<a href="#" tabIndex="-1" data-topic-id="${synonym.syn_ant_topic_id}">${synonym.syn_ant}</a>`
                    )
                    .join('&nbsp;&nbsp;')
                }
                </p>
            </div>
        `);

        $parent.append($el);
        $parent.find('a').on('click', function (e) {
            redirectable ? refreshWordDetail.call(this, e) : e.preventDefault();
        });
    }

    function generateSimilarWords(data, $parent, redirectable = false) {
        if (!data || !data.length) return;

        let $el = $(`
            <div class="section">
                <p class="section-title">形近词</p>
                <p class="p-words">
                ${
                    data.map(similarWord => 
                        `<a href="#" tabIndex="-1" data-topic-id="${similarWord.topic_id}">${similarWord.word}</a>`
                    )
                    .join('&nbsp;&nbsp;')
                }
                </p>
            </div>
        `);

        $parent.append($el);
        $parent.find('a').on('click', function (e) {
            redirectable ? refreshWordDetail.call(this, e) : e.preventDefault();
        });
    }

    function refreshWordDetail(e) {
        e.preventDefault && e.preventDefault();

        $doc.trigger(events.WORD_DETAIL, [this]);
    }

    window.generateWordDetail = generateWordDetail;
    window.generateStudyWordDetail = generateStudyWordDetail;
} (this, document, jQuery));