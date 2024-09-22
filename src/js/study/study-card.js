;(function(window, $) {
    'use strict';

    const resourceDomain = 'https://7n.bczcdn.com';
    const {highlightSentence} = window.utilModule;
    const generateStudyWordDetail = window.generateStudyWordDetail;

    class StudyCard {
        wordInfo;
        type;
        onComplete;
        failedTimes = 0;
        $el;

        constructor(wordInfo, type, $el, onComplete) {
            this.wordInfo = wordInfo;
            this.$el = $el;
            this.selectCard = new SelectCard({
                wordInfo,
                type,
                $el: this.$el.find("#body"),
                onPass: () => {},
                onFail: () => this.failedTimes++
            });
            this.onComplete = onComplete;
        }

        render() {
            this.selectCard.render()
                .waitForPass()
                .then(() =>
                    new DetailCard({
                        wordInfo: this.wordInfo,
                        $el: this.$el,
                        renderNecessary: this.failedTimes || this.wordInfo.isNew
                    })
                    .render()
                    .waitForContinue()
                )
                .then(() => this.onComplete(null, this.failedTimes))
                .catch((e) => this.onComplete(e));
        }
    }

    class SelectCard {
        wordInfo;
        type;
        $el;
        $correctOption;

        constructor(options) {
            this.wordInfo = options.wordInfo;
            this.type = options.type;
            this.$el = options.$el;
            this.onPass = options.onPass;
            this.onFail = options.onFail;
        }

        render() {
            let anySentenceAbsent = this.wordInfo.dict.sentences?.length === 0 ||
                    this.wordInfo.similarWords.some(w => w.dict.sentences?.length === 0);

            this.$el.empty();

            // 句子 + 图片
            if (this.type === 'sentenceImages') {
                this._renderSentence();
                this._renderImageOptions(false);
            } 
            // 单词 + 图片
            else if (this.type === 'wordImages') {
                this._renderWord();
                this._renderImageOptions(true);
            } 
            // 单词 + 文本
            else if (this.type === 'wordMeans') {
                this._renderWord();
                this._renderTextOptions();                        
            }

            this.$el.find('audio')[0]?.play();

            return this;
        }

        waitForPass() {
            return new Promise((resolve, reject) => {
                if (!this.$correctOption) {
                    this.onPass && this.onPass();
                    resolve();
                }

                this.$correctOption.on('click', () => {
                    setTimeout(() => {
                        this.onPass && this.onPass();
                        resolve();
                    }, 100);
                });
            });
        }

        _renderSentence() {
            let sentence = this.wordInfo.dict.sentences[0];
            let word = this.wordInfo.dict.word_basic_info.word;
            let $body = $(`
                <div id="reviewerBodyDiv" class="row d-flex justify-content-center align-items-center body">
                    <p class="sentence">${highlightSentence(sentence, word)}</p>                    
                    <p class="hint" style="display: none">
                        ${sentence.sentence_trans}                        
                        <audio id="hintAudio" style="display: none;">
                            <source src="${resourceDomain + sentence.audio_uri}">
                        </audio>
                    </p>  
                </div>
            `);
            $body.find('.sentence').on('click', (e) => $('#hintAudio')[0].play());
            this.$el.append($body);
        }

        _renderWord() {
            let wordBasicInfo = this.wordInfo.dict.word_basic_info;
            let accents = [...new Set([wordBasicInfo.accent_uk, wordBasicInfo.accent_usa])];
            let showEtyma = !!wordBasicInfo.etyma;
            let hintString = showEtyma ?
                wordBasicInfo.etyma :
                highlightSentence(this.wordInfo.dict.sentences[0], wordBasicInfo.word);
            let $body = $(`
                <div id="reviewerBodyDiv" class="row d-flex justify-content-center align-items-center body">
                    <p class="word">${wordBasicInfo.word}</p>
                    <p class="accent">
                        ${accents.join(',')}
                    </p>                         
                    <p class="hint" style="display: none">
                        ${hintString}
                        <audio id="hintAudio" style="display: none;">
                            <source src="${resourceDomain + wordBasicInfo.accent_uk_audio_uri}">
                        </audio>
                    </p>
                </div>
            `);
            if (!showEtyma) {
                $body.find('.hint').append(`
                    <audio><source src="${resourceDomain + this.wordInfo.dict.sentences[0].audio_uri}"></audio>`);
            }
            $body.find('.word, .accent').on('click', (e) => $('#hintAudio')[0].play());
            this.$el.append($body);
        }

        _renderImageOptions(showMeans) {
            let randomIndex = Math.floor(Math.random() * 4);
            let words = this.wordInfo.similarWords.toSpliced(randomIndex, 0, this.wordInfo);
            let $optionsDiv = $(`<div id="optionsDiv"></div>`);
            let $row;

            for (let i = 0; i < words.length; i++) {
                if (i % 2 === 0) {
                    if ($row) $optionsDiv.append($row)

                    $row = $(`<div class="row"></div>`);
                    if (i === 2) $row.css('margin-top', '10px');
                }

                let means = words[i].dict.chn_means.reduce((prev, curr) => {
                    prev[curr.mean_type] = prev[curr.mean_type] || [];
                    prev[curr.mean_type].push(curr.mean);
                    return prev;
                }, Object.create(null));
                let meanStr = Object.entries(means).map(([k, v]) => `${k}${v.join(',')}`).join(';');
                let $option = $(`
                    <div class="image-container col-5 ${i % 2 === 1 ? '' : 'offset-1'}">
                        <img src="${resourceDomain}${words[i].dict.sentences[0]?.img_uri}">
                        <div class="overlay-text" style="display: ${showMeans ? 'block' : 'none'}">
                            <span title="${meanStr}" alt="${meanStr}">${meanStr}</span>
                        </div>
                    </div>
                `);

                if (words[i].dict.word_basic_info.topic_id === 
                        this.wordInfo.dict.word_basic_info.topic_id) {
                    this.$correctOption = $option;
                } else {
                    $option.on('click', () => {
                        this.onFail && this.onFail();
                        $('.hint').show().find('audio')[0].play();
                    })
                }

                $row.append($option);
            }

            $optionsDiv.append($row);
            this.$el.append($optionsDiv);
        }

        _renderTextOptions() {
            let randomIndex = Math.floor(Math.random() * 4);
            let words = this.wordInfo.similarWords.toSpliced(randomIndex, 0, this.wordInfo);
            let $optionsDiv = $(`<div id="optionsDiv"></div>`);

            for (let i = 0; i < words.length; i++) {
                let means = words[i].dict.chn_means.reduce((prev, curr) => {
                    prev[curr.mean_type] = prev[curr.mean_type] || [];
                    prev[curr.mean_type].push(curr.mean);
                    return prev;
                }, Object.create(null));
                let meanStr = Object.entries(means).map(([k, v]) => `${k}${v.join(',')}`).join(';');
                let $option = $(`
                    <div class="row text-options"> ${meanStr}</div>
                `);

                if (words[i].dict.word_basic_info.topic_id === 
                        this.wordInfo.dict.word_basic_info.topic_id) {
                    this.$correctOption = $option;
                } else {
                    $option.on('click', () => {
                        this.onFail && this.onFail();
                        $('.hint').show().find('audio:last-child')[0].play();
                    })
                }

                $optionsDiv.append($option);
            }

            this.$el.find('#optionsDiv').remove();
            this.$el.append($optionsDiv);
        }
    }

    class DetailCard {
        wordInfo;
        renderNecessary;
        $body;
        $tail;

        constructor(options) {
            this.wordInfo = options.wordInfo;
            this.$body = options.$el.find('#body');
            this.$tail = options.$el.find('#tail');
            this.renderNecessary = options.renderNecessary;
        }

        render() {
            if (!this.renderNecessary) {
                return this;
            }

            this.$body.empty();
            generateStudyWordDetail(this.wordInfo, this.$body);
            this.$tail.show();

            return this;
        }

        waitForContinue() {
            return new Promise(resolve => {
                if (!this.renderNecessary) {
                   return resolve();
                }

                this.$tail.off('click')
                    .on('click', () => {
                        this.$tail.hide();
                        resolve();
                    });
            })
        }
    }

    window.StudyCard = StudyCard;
} (this, jQuery));