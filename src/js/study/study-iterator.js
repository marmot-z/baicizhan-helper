;(function (window, $) {
    'use strict';

    const StudyCard = window.StudyCard;
    const apiModule = window.apiModule;

    class StudyIterator {
        // 当前复习的单词
        currentWord;
        // 单词列表
        words;
        // 当前正在复习的单词
        queue;
        // 总共复习单词的数量
        total;
        // 复习通过单词的数量
        pass;
        // 类型：sentenceImages, wordImages, wordMeans
        types = ['sentenceImages', 'wordImages', 'wordMeans',];
        // 单词详情信息
        wordDetailMap = {};
        // 复习时的回调方法
        _onStudy;
        // 单词学习成功、失败次数
        metrics;
        $el;

        constructor(words, $el, onStudy) {
            this.words = words;
            this.total = this.words.length * 3;
            this.pass = 0;
            this.queue = Array.from(this.words);
            this._onStudy = onStudy;
            this.metrics = new Map();
            this.$el = $el;
        }

        next() {
            // 当前类型复习结束，切换到下一类型，并重置复习列表
            if (this.queue.length === 0) {
                this.types.shift();
                this.queue = Array.from(this.words);
            }

            this.currentWord = this.queue.shift();

            new Promise(resolve => {
                if (this.wordDetailMap[this.currentWord.topic_id])
                    return resolve(this.wordDetailMap[this.currentWord.topic_id]);

                fetchWordDetailInfo(this.currentWord)
                    .then(wordInfo => {
                        wordInfo.isNew = this.currentWord.isNew;
                        resolve(this.wordDetailMap[this.currentWord.topic_id] = wordInfo);
                    })
            })
            .then(wordInfo => new StudyCard(wordInfo, this.types[0], this.$el, this.onStudy.bind(this)).render())
            .catch((e) => this.onStudy(e));
        }

        onStudy(error, failedTimes) {
            if (error) {
                console.error(`学习 ${this.currentWord.dict.word_basic_info.word} 单词时出现了异常`, error);
            }

            if (!this.metrics.has(this.currentWord.topic_id)) {
                this.metrics.set(this.currentWord.topic_id, {
                    doneTimes: 0,
                    wrongTimes: 0,
                    wordLevelId: this.currentWord.word_level_id
                });
            }

            if (!error && failedTimes > 0) {
                this.queue.push(this.currentWord);
                this.metrics.get(this.currentWord.topic_id).wrongTimes++;
            } else {
                this.pass++;
                this.metrics.get(this.currentWord.topic_id).doneTimes++;
            }

            this._onStudy && this._onStudy();
        }

        hasNext() {
            return this.types.length !== 1 || this.queue.length !== 0;
        }

        getProgress() {
            return Math.trunc(this.pass / this.total * 100);
        }

        getWords() {
            return Object.values(this.wordDetailMap);
        }

        getMetrics() {
            return Array.from(this.metrics.entries())
                .map(([k, v]) => Object.assign({topicId: k}, v));
        }
    }

    function fetchWordDetailInfo(word) {
        // 额外查询相似单词的详细信息，并进行返回
        return apiModule.getWordDetail(word.topic_id, true, false, true)
            .then(wordInfo => {
                return Promise.all(
                    word.options.map(_topicId =>
                        apiModule.getWordDetail(_topicId, true, false, false))
                )
                .then((similarWordInfos) => {
                    wordInfo.similarWords = similarWordInfos;
                    return wordInfo;
                });
            });
    }

    window.StudyIterator = StudyIterator;
}) (this, jQuery);