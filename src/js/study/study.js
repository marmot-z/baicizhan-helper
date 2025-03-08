; (function (window, doc, $) {
    'use strict';

    const StudyIterator = window.StudyIterator;
    const apiModule = window.apiModule;
    const storageModule = window.storageModule;

    class Study {
        // 状态：ready, ending, pending, error
        state;
        // 模式：study, review
        mode;
        learnedWords;
        learningWords;
        learnBookInfo;
        iterator;
        $el;

        constructor($el) {
            this.$el = $el;
        }

        async start() {
            this.state = 'ready';
            this.learnBookInfo = await getLearnBookInfo();
            await loadLearnedWords(this.learnBookInfo.book_id);
            this.learningWords = await getLearningWords(this.learnBookInfo.daily_plan_count);

            this.updateView();
        }

        _doStart() {
            this.state = 'pending';
            let words = this.mode === 'study' ? this.learningWords : this.learnedWords;
            this.iterator = new StudyIterator(words, this.$el, this.updateView.bind(this));
            this._initProgress();
            this.updateView();
        }

        updateView() {
            switch (this.state) {
                case 'ready': return this._readyView();
                case 'ending': return this._endingView();
                case 'error': return this._errorView();
                case 'pending':
                default: return this._updateStudyView();
            }
        }

        _readyView() {
            let html = '<div class="row d-flex justify-content-center align-items-center body">';
            let hasLearningWords = this.learningWords && this.learningWords.length;

            if (!hasLearningWords) {
                html += `恭喜你已经学完了「${this.learnBookInfo.name}」`;
            } else {
                html += `
                    <p style="font-size: x-large;">
                        <button id="reviewBtn" type="button" class="btn btn-outline-primary btn-sm">复习</button>                         
                        <input type="text" id="calendar"> 单词
                    </p>
                    <p style="font-size: x-large;">
                        <button id="studyBtn" type="button" class="btn btn-outline-primary btn-sm">学习</button> 新词
                    </p>
                `;
            }

            html += '</div>';
            html += `
                <div class="row d-flex justify-content-center align-items-center" style="margin: 10px 0;">
                    <ul>
                        快捷键：
                        <li><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd> 1~4数字键选中对应选项</li>
                        <li><kbd>Space</kbd> 空格键继续</li>
                    </ul>
                </div>    
                <div class="row d-flex justify-content-center align-items-center" style="padding: 0 10%;">
                    <b><u>
                    注意：该功能仅限于个人的学习使用，不得用于任何形式的商业活动。
                    </u></b>                    
                </div>
            `;

            this.$el.find('#body').empty().html(html);
            this._initCalendar();
            this.$el.find('#studyBtn').on('click', () => this._doStart(this.mode = 'study'));
            this.$el.find('#reviewBtn').on('click', async () => {
                const dateText = this.$el.find('#calendar').val();
                const words = await getCalendarDailyInfo(parseInt(dateText));

                if (!words || words.length === 0) {
                    alert('该日期没有学习记录');
                    return;
                }

                this.learnedWords = words;
                this._doStart(this.mode = 'review');
            });                        
        }

        async _initCalendar() {
            const $calendar = this.$el.find('#calendar');    
            const today = new Date();
            
            $calendar.datepicker({
                dateFormat: 'yymmdd',
                maxDate: today,
                showOtherMonths: true,
                selectOtherMonths: true,
                showButtonPanel: true,
                changeMonth: true,
                changeYear: true,
                yearRange: '2020:+0',
                showAnim: 'slideDown',
                defaultDate: today
            });            
            $calendar.val($.datepicker.formatDate('yymmdd', today))
                    // 设置日历输入框为只读，防止手动输入
                    .attr('readonly', 'readonly')        
                    // 添加样式使其看起来像按钮
                    .css({
                        'cursor': 'pointer',
                        'background-color': 'transparent',
                        'border': '1px solid #0d6efd',
                        'border-radius': '0.25rem',
                        'padding': '0.25rem 0.5rem',
                        'font-size': '0.875rem',
                        'color': '#0d6efd',
                        'width': 'auto'
                    });
        }

        _updateStudyView() {
            this._updateProgress();

            try {
                if (!this.iterator.hasNext()) {
                    this.state = 'ending';
                    return this.updateView();
                }

                this.iterator.next();
            } catch (e) {
                console.error(`背单词出现了异常`, e);
                this.state = 'error';
                this.updateView();
            }
        }

        _initProgress() {
            let words = this.mode === 'study' ? this.learningWords : this.learnedWords;
            let modeName = this.mode === 'study' ? '学习' : '复习';
            this.$el.find('#head')
                .empty()
                .append(`需${modeName} ${words.length} 词&nbsp;&nbsp;|&nbsp;&nbsp;<span id="progressP">当前进度：0%</span>`);
        }

        _updateProgress() {
            this.$el.find('#progressP')
                .html(`当前进度：${this.iterator.getProgress()}%`);
        }

        _endingView() {
            let words = this.iterator.getWords();
            let modeName = this.mode === 'study' ? '学习' : '复习';

            words.forEach(word => {
                let meanGroup = Object.groupBy(word.dict.chn_means, (m) => m.mean_type);
                word.mean = Object.entries(meanGroup)
                    .map(([k, v]) =>
                        `${k}${v.map(v => v.mean).join(',')}`)
                    .join(';');
            });

            let isStudy = this.mode === 'study';
            let render = (updated) => {
                this.$el.find('#body')
                    .empty()
                    .html(`
                        <div class="word-list">
                            <p style="font-size: x-large;">
                                恭喜，您已完成${modeName}了 ${words.length} 个单词${updated ? '（学习记录已上传）' : ''} 🎉🎉🎉
                            </p>
                            ${words.map(w =>
                        `<p class="word-brief-info"><b>${w.dict.word_basic_info.word}</b>\t${w.mean}</p>`)
                            .join('')
                        }
                        </div>
                `);
            };

            render(isStudy);

            if (isStudy) {
                apiModule.updateDoneData(this.iterator.getMetrics());
            }
        }

        _errorView() {
            this.$el.find('#body')
                .empty()
                .html(`
                <div class="row d-flex justify-content-center align-items-center body">
                    <p style="font-size: x-large;">
                        发生错误了，请稍后再试😅
                    </p>
                </div>
            `);
        }
    }

    function formatDateAsYYYYMMDD(date) {
        return "".concat(
            date.getFullYear(),
            date.getMonth() < 9 ? ('0' + (date.getMonth() + 1)) : (date.getMonth() + 1),
            date.getDate() < 10 ? ('0' + date.getDate()) : date.getDate()
        );
    }

    async function getCalendarDailyInfo(dateNumber = null) {
        if (!dateNumber) {
            dateNumber = Number.parseInt(formatDateAsYYYYMMDD(new Date()));
        }
        let calendarDailyInfo = await apiModule.getCalendarDailyInfo(dateNumber);

        let words = calendarDailyInfo?.words;

        if (words) {
            let bookWords = await storageModule.get('bookWords');
            let bookWordMap = new Map(bookWords.map(i => [i.topic_id, i]));
            words.forEach(word => word.options = bookWordMap.get(word.topic_id)?.options);
        }

        return words;
    }

    async function getLearnBookInfo() {
        return await storageModule.get('bookPlanInfo') || await apiModule.getAllBookInfo();
    }

    async function loadLearnedWords(bookId) {
        let lastLoadTime = await storageModule.get('loadLearnedWordsTimestamp') || 0;
        let learnedWords = await storageModule.get('learnedWords');
        let now = new Date().getTime();
        let oneDayTimestamp = 24 * 60 * 60 * 1000;
        let notUpdateInTenDays = now - lastLoadTime <= 10 * oneDayTimestamp;

        // 上次距今小于 10 天，则依次加载对应时间内学习的单词
        if (!!learnedWords && notUpdateInTenDays) {
            let date = new Date(lastLoadTime);
            let recentLearnedWords = [];
            date.setHours(0, 0, 0, 0);

            do {
                let oneDayLearnedWords = await apiModule.getCalendarDailyInfo(formatDateAsYYYYMMDD(date));
                recentLearnedWords = recentLearnedWords.concat(oneDayLearnedWords.words);

                date.setDate(date.getDate() + 1);
            } while (date.getTime() < now);

            let learnedWordSet = new Set(learnedWords.map(i => i.topic_id));
            let absentLearnedWords = recentLearnedWords
                ?.filter(w => !learnedWordSet.has(w.topic_id))
                ?.map(w => {
                    return {
                        topic_id: w.topic_id,
                        word: w.word,
                        word_level_id: w.word_level_id,
                        done_times: 1,
                        wrong_times: 0
                    };
                });
            learnedWords = learnedWords.concat(absentLearnedWords);

            await storageModule.set('learnedWords', learnedWords);
        }
        // 超过 10 天，则全量加载
        else {
            await storageModule.set('learnedWords', await apiModule.getLearnedWords(bookId));
        }

        await storageModule.set('loadLearnedWordsTimestamp', now);
    }

    async function getLearningWords(learnSize = 15) {
        let bookWords = await storageModule.get('bookWords');
        let learnedWords = await storageModule.get('learnedWords');
        let bookWordMap = new Map(bookWords.map(i => [i.topic_id, i]));
        let learnedWordIds = learnedWords.map(i => i.topic_id);
        let learningWordIds = [];

        for (let wordId of bookWordMap.keys()) {
            if (learnedWordIds.indexOf(wordId) === -1) {
                learningWordIds.push(wordId);
                if (--learnSize <= 0) break;
            }
        }

        return learningWordIds.map(i => {
            let word = bookWordMap.get(i);
            word.isNew = true;
            return word;
        });
    }

    function initEventListener() {
        $(doc).on('keydown', (event) => {
            // 1~4，选中选项
            if (event.key >= '1' && event.key <= '5') {
                event.preventDefault();
                event.stopPropagation();
                $('.image-container,.text-options').eq(+event.key - 1).click();
            }

            // 空格键，继续
            if (event.code === 'Space') {
                event.preventDefault();
                event.stopPropagation();
                return $('#tail').click();
            }
        });
    }

    window.onload = async () => {
        let enable = !!await storageModule.get('enableStudy');

        if (!enable) {
            alert('暂未开启「背单词」功能，请前往选项页设置中开启「背单词」功能');
            window.close();
            return;
        }

        new Study($('#studyDiv')).start();
        initEventListener();
    }
})(this, document, jQuery);