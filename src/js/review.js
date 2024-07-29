;(function (window, $) {

    const resourceDomain = 'https://7n.bczcdn.com';
    const {levenshtein} = window.utilModule;
    const {EnglishStemmer} = window.__baicizhanHelperModule__;
    const stemmer = new EnglishStemmer();
    let $el;

    class Reviewer {
        // 状态：ready, notReady, ending, pending, error
        state;
        // 单词列表
        words;
        // 当前进行的环节
        iterator;
    
        async start() {
            await this._fetchCalendarDailyInfo();   
            this.updateView();     
        }
    
        _doStart() {            
            this.state = 'pending';
            this.iterator = new ReviewIterator(this.words, this.updateView.bind(this));
            this._initProgress();
            this.updateView();
        }
    
        async _fetchCalendarDailyInfo() {
            let date = new Date();
            let dateString = "".concat(
                date.getFullYear(),
                date.getMonth() < 9 ? ('0' + (date.getMonth() + 1)) : (date.getMonth() + 1),
                date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate()
            );
            let dateNumber = Number.parseInt(dateString);
            let calendatDailyInfo = await window.apiModule.getCalendarDailyInfo(dateNumber);
            this.words = calendatDailyInfo.words;
            this.state = this.words.length > 0 ? 'ready' : 'notReady';
        }
    
        updateView() {
            switch(this.state) {
                case 'ready': return this._readyView();
                case 'notReady': return this._notReadyView();
                case 'ending': return this._endingView();
                case 'error': return this._errorView();
                case 'pending':
                default: return this._updateReviewView();
            }
        }
    
        _readyView() {
            $el.empty();
            $el.html(`
                <div class="row d-flex justify-content-center align-items-center body">
                    <p style="font-size: x-large;">
                        你今天已经学习了 ${this.words.length} 个单词                
                    </p>
                    <p style="font-size: x-large;">
                        点击<button id="startBtn" type="button" class="btn btn-outline-primary btn-sm">这里</button>开始复习
                    </p>
                </div>
            `);
            $el.find('#startBtn').on('click', this._doStart.bind(this));
        }
        
        _updateReviewView() {
            this._updateProgress();

            if (!this.iterator.hasNext()) {
                this.state = 'ending';
                return this.updateView();
            }
            
            this.iterator.next();
        }

        _initProgress() {
            $el.empty();
            $el.append(`
                <div id="reviewerHeadDiv" class="row head">
                    <p>需复习 ${this.words.length} 词</p>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <p id="progressP">当前进度：30%</p>
                </div>
            `);
        }

        _updateProgress() {
            $el.find('#progressP').html(`当前进度：${this.iterator.getProgress()}%`);
        }
    
        _notReadyView() {
            $el.empty();
            $el.html(`
                <div class="row d-flex justify-content-center align-items-center body">
                    <p style="font-size: x-large;">
                        你今天就根本没背单词😒 <br> 赶紧去 APP 背单词吧📚
                    </p>
                </div>
            `);
        }
    
        _endingView() {
            $el.empty();
            $el.html(`
            <div class="row d-flex align-items-center" style="height: 100%; overflow-y: scroll; padding: 0 10px;">
                <p style="font-size: x-large;">
                    你已完成复习了 ${this.words.length} 个单词 🐮🍺
                </p>
                ${
                    this.words.map(w => 
                        `<p class="word-brief-info">
                            <b>${w.word}</b>\t${w.mean}
                        </p>`).join('')
                }                
            `);
        }
    
        _errorView() {
            $el.empty();
            $el.html(`
                <div class="row d-flex justify-content-center align-items-center body">
                    <p style="font-size: x-large;">
                        发送错误了，请稍后再试😅
                    </p>
                </div>
            `);
        }
    }
    
    class ReviewIterator {
        // 当前复习的单词
        currentWord;
        // 单词列表
        _words;
        // 当前正在复习的单词
        quque;
        // 总共复习单词的数量
        total;
        // 复习通过单词的数量
        pass;
        // 类型：sentenceImages, wordImages, wordMeans
        types = ['sentenceImages', 'wordImages', 'wordMeans',];
        // 单词详情信息
        wordDetailMap = {};
        // 复习时的回调方法
        _onReview;
    
        constructor(words, onReview) {
            this._words = words;
            this.total = this._words.length * 3;
            this.pass = 0;
            this.queue = Array.from(this._words);
            this._onReview = onReview;
        }
    
        next() {
            // 当前类型复习结束，切换到下一类型，并重置复习列表
            if (this.queue.length == 0) {                
                this.types.shift();
                this.queue = Array.from(this._words);
            }

            this.currentWord = this.queue.shift();

            new Promise(resolve => {
                if (this.wordDetailMap[this.currentWord.topic_id])
                    return resolve(this.wordDetailMap[this.currentWord.topic_id]); 

                this._fetchWordDetailInfo(this.currentWord.topic_id)
                    .then(wordInfo => resolve(this.wordDetailMap[this.currentWord.topic_id] = wordInfo))
            })
            .then(wordInfo => new ReviewCard(wordInfo, this.types[0], this.onReview.bind(this)).render());
        }

        onReview(type) {
            if (type === 'fail') {
                this.queue.push(this.currentWord);
            } else {
                this.pass++;
            }

            this._onReview && this._onReview();
        }

        _fetchWordDetailInfo(topicId) {
            // 额外查询相似单词的详细信息，并进行返回
            return apiModule.getWordDetail(topicId, true, false, true)
                    .then(wordInfo => {                    
                        let similarWordTopicIds = wordInfo.similar_words.map(w => w.topic_id);

                        return Promise.all(
                                similarWordTopicIds.map(_topicId => 
                                    apiModule.getWordDetail(_topicId, true, false, false))
                            )
                            .then((similarWordInfos) => {
                                wordInfo.similarWords = similarWordInfos;
                                return wordInfo;
                            });
                    });
        }

        hasNext() { 
            return this.types.length != 1 || this.queue.length != 0;
        }

        getProgress() {
            return Math.trunc(this.pass / this.total * 100);
        }
    }
    
    class ReviewCard {
        $correctOption;
        wordInfo;
        type;
        onReview;

        constructor(wordInfo, type, onReview) {
            this.wordInfo = wordInfo;
            this.type = type;
            this.onReview = onReview;            
        }
    
        render() {                
            let anySentenceAbsent = this.wordInfo.dict.sentences?.length == 0 ||
                    this.wordInfo.similarWords.some(w => w.dict.sentences?.length == 0);

            // 如果出现句子缺失的情况，则该单词不进行复习
            if (anySentenceAbsent) {
                return this.onReview('pass');
            }

            let showMeans = this.type !== 'sentenceImages';

            if (this.type === 'wordMeans') {
                this._renderWord();
                this._renderTextOptions();                        
            } else {
                this._renderSentence(showMeans);
                this._renderImageOptions(showMeans);
            }
        }

        _renderSentence(showMeans) {
            let sentence = this.wordInfo.dict.sentences[0];
            let word = this.wordInfo.dict.word_basic_info.word;
            let $body = $(`
                <div id="reviewerBodyDiv" class="row d-flex justify-content-center align-items-center body">
                    <p class="sentence">${this._highlight(sentence, word)}</p>
                    <audio id="reviewSentenceAudio" style="display: none;">
                        <source src="${resourceDomain + sentence.audio_uri}">
                    </audio>
                    <p class="transSentence" style="display: ${showMeans ? 'block' : 'none'}">${sentence.sentence_trans}</p>            
                </div>
            `);
            $body.find('.sentence').on('click', (e) => $('#reviewSentenceAudio')[0].play());
            $el.find('#reviewerBodyDiv').remove();
            $el.append($body);
        }

        _highlight(sentence, word) {
            if (sentence.highlight_phrase) {
                return sentence.sentence.replace(
                    sentence.highlight_phrase, 
                    `<span style="color: #007bff;">${sentence.highlight_phrase}</span>`
                );
            }
    
            let stemWord = stemmer.stemWord(word);
            let highlightWord = sentence.sentence.split(/\s/)
                    .map(s => {
                        let regex = /[\w-]+/;
    
                        if (regex.test(s)) {
                            let term = s.match(regex)[0];
                            let distance = levenshtein(term, stemWord);
                            let highlightable = term.length < 7 ? distance <= 3 : distance <= 5;
    
                            if (highlightable) {
                                return [distance, term];
                            }
                        }
    
                        return null;
                    })
                    .filter(pair => pair !== null)
                    .reduce((a, b) => a[0] < b[0] ? a : b);
    
            if (!highlightWord) {
                return sentence.sentence;
            }
            
            let replaceRegex = new RegExp(`\\b${highlightWord[1]}\\b`, 'g');
    
            return sentence.sentence.replace(replaceRegex, (match) => {
                return `<span style="color: #007bff;">${match}</span>`;
            });
        }

        _renderWord() {
            let accents = [...new Set([this.wordInfo.dict.word_basic_info.accent_uk, this.wordInfo.dict.word_basic_info.accent_usa])];
            let $body = $(`
                <div id="reviewerBodyDiv" class="row d-flex justify-content-center align-items-center body">
                    <p class="word">${this.wordInfo.dict.word_basic_info.word}</p>
                    <p class="accent">
                        ${accents.join(',')}
                    </p>     
                    <audio id="reviewAccentUkAudio" style="display: none;">
                        <source src="${resourceDomain + this.wordInfo.dict.word_basic_info.accent_uk_audio_uri}">
                    </audio>
                </div>
            `);
            $body.find('.word, .accent').on('click', (e) => $('#reviewAccentUkAudio')[0].play());
            $el.find('#reviewerBodyDiv').remove();
            $el.append($body);
        }

        _renderImageOptions(showMeans) {
            let randomIndex = Math.floor(Math.random() * 4);
            let words = this.wordInfo.similarWords.toSpliced(randomIndex, 0, this.wordInfo);
            let $optionsDiv = $(`<div id="optionsDiv"></div>`);
            let $row;

            for (let i = 0; i < words.length; i++) {
                if (i % 2 == 0) {
                    if ($row) $optionsDiv.append($row);
                    $row = $(`<div class="row"></div>`);
                }

                let means = words[i].dict.chn_means.reduce((prev, curr) => {
                    prev[curr.mean_type] = prev[curr.mean_type] || [];
                    prev[curr.mean_type].push(curr.mean);
                    return prev;
                }, Object.create(null));
                let meanStr = Object.entries(means).map(([k, v]) => `${k}${v.join(',')}`).join(';');
                let $option = $(`
                    <div class="image-container">
                        <img src="${resourceDomain}${words[i].dict.sentences[0].img_uri}">
                        <div class="overlay-text" style="display: ${showMeans ? 'block' : 'none'}">
                            <span title="${meanStr}" alt="${meanStr}">${meanStr}</span>
                        </div>
                    </div>
                `);

                if (words[i].dict.word_basic_info.topic_id === 
                        this.wordInfo.dict.word_basic_info.topic_id) {
                    this.$correctOption = $option;
                    $option.on('click', () => {
                        this.$correctOption.append(`<div class="overlay-sign">✅</div>`);
                        $optionsDiv.find('.image-container').off('click');
                        window.setTimeout(() => this.onReview('pass'), 500);
                    });
                } else {
                    $option.on('click', () => {
                        if (!showMeans) {
                            $('#reviewerBodyDiv').find('.transSentence').show();
                        }
                        this.$correctOption.append(`<div class="overlay-sign">✅</div>`);
                        $option.append(`<div class="overlay-sign">❌</div>`);
                        $optionsDiv.find('.image-container').off('click');
                        window.setTimeout(() => this.onReview('fail'), 3000);
                    });
                }

                $row.append($option);
            }

            $optionsDiv.append($row);
            $el.find('#optionsDiv').remove();
            $el.append($optionsDiv);
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
                    $option.on('click', () => {
                        this.$correctOption.append(`<div class="text-options-sign">✅</div>`);
                        $optionsDiv.find('.text-options').off('click');
                        window.setTimeout(() => this.onReview('pass'), 500);
                    });
                } else {
                    $option.on('click', () => {
                        this.$correctOption.append(`<div class="text-options-sign">✅</div>`);
                        $option.append(`<div class="text-options-sign">❌</div>`);
                        $optionsDiv.find('.text-options').off('click');
                        window.setTimeout(() => this.onReview('fail'), 2500);
                    });
                }

                $optionsDiv.append($option);
            }

            $el.find('#optionsDiv').remove();
            $el.append($optionsDiv);
        }
    }

    window.initReview = () => {
        $el = $('#reviewDiv');
        new Reviewer().start();
    };
}) (this, jQuery);