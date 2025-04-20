;(function(window, document, $) {
    'use strict';

    const $doc = $(document);
    const resourceDomain = 'https://7n.bczcdn.com';
    const {getBookWords, cancelCollectWord, getWordDetail} = window.apiModule;
    const {WordbookStorage} = window.wordbookStorageModule;
    const sortFns = {
        'collectTimeAscOrder': (a, b) => a.created_at - b.created_at,
        'collectTimeDescOrder': (a, b) => b.created_at - a.created_at,
        'firstLettersAscOrder': (a, b) => {
            let aWord = a.word.toLowerCase();
            let bWord = b.word.toLowerCase();

            return aWord.charAt(0) > bWord.charAt(0) ? 1 : -1;
        },
        'firstLettersDescOrder': (a, b) => {
            let aWord = a.word.toLowerCase();
            let bWord = b.word.toLowerCase();

            return bWord.charAt(0) > aWord.charAt(0) ? 1 : -1;
        },
    };
    let audioContext, audioBinaryData, currentAudioSrc;
    let currentWordDetailIndex = -1;

    function init() {
        $doc.on(events.AUTHED, (e) => loadWordbookTable(false));        
        $doc.on(events.BOOKS_LOADED, generateWordbooks);
        $doc.on(events.UNAUTHED, clearStorageWords);
        $doc.on(events.WORD_DETAIL, refreshWordDetail);
        $doc.on('keydown', bindShortcutKey);
        $('#wordbookSelect').on('change', (e) => loadWordbookTable(false));
        $('#wordbookRefreshButton').on('click', (e) => loadWordbookTable(true));
        $('#maskMeanButton').on('click', maskMeans);
        $('#maskEnglishButton').on('click', maskEnglish);        
        $('#collectTimeDescOrderBtn,#collectTimeAscOrderBtn,#firstLettersAscOrderBtn,#firstLettersDescOrderBtn').on('click', refreshWordbookTable);
    }

    async function loadWordbookTable(focus) {
        let bookId = $('#wordbookSelect').val() || 
                        await storageModule.get('bookId') || 0;

        try {
            let wordbookData = focus ?
                    await loadFromServer(bookId) :
                    await loadFromLocal(bookId) || await loadFromServer(bookId);

            generateWordbookTable(wordbookData);
        } catch(e) {
            console.error(`加载单词本 ${bookId} 内容错误`, e);
            window.Analytics.fireErrorEvent(e, { message: '加载单词本内容失败' });
            generateErrorTips();
        }
    }

    function loadFromServer(bookId) {
        window.Analytics.fireEvent('loadBookWords', { bookId });

        return getBookWords(bookId).then(data => {
            WordbookStorage.save(bookId, data);
            return data;
        });
    }

    function loadFromLocal(bookId) {
        return WordbookStorage.load(bookId);
    }

    function generateWordbookTable(data) {
        let $tbody = $('#wordbookContentTable > tbody').empty();
        let englishMasked = $('#maskEnglishButton').prop('checked');
        let meansMasked = $('#maskMeanButton').prop('checked');
        let order = $('#orderBtns > .btn-outline-primary').data('order');
        let sortFn = sortFns[order] || sortFns.collectTimeDescOrder;

        data.sort(sortFn);
        data.forEach((item, index) => generateWordRow(item, $tbody, index, englishMasked, meansMasked));
    }

    function generateWordRow(data, $parent, index, englishMasked, meansMasked) {
        let audioSrc = data.audio_uk.startsWith('http') ?
                data.audio_uk :
                resourceDomain + data.audio_uk;                
        let $el = $(`
            <tr tabIndex="${++index}">
                <td>
                    <span name="starIcon" style="cursor: pointer;">
                        <img src="../svgs/star-fill.svg" />
                    </span>
                </td>
                <td>
                    <span name="wordSpan" class="${englishMasked ? 'word-row-hidden' : 'word-row'}" 
                        data-masked="${englishMasked}">${data.word}</span> &nbsp;&nbsp;
                    <span name="accentIcon" style="cursor: pointer;">
                        <img src="../svgs/volume-up.svg" />
                    </span>
                    <span style="font-size: x-small; color: #a1a5ab;">收藏时间：${formatDate(data.created_at)}</span>
                    <a name="detailLink" href="#" data-topic-id="${data.topic_id}" tabIndex="-1" style="float: right; color: #606266;">详情 > </a> <br>
                    <span name="searchMeansSpan" class="searchMeans" data-masked="${meansMasked}" 
                        style="background: ${meansMasked ? '#6a6d71' : 'none'}">${data.mean}</span>
                </td>
            </tr> 
        `);

        $el.appendTo($parent);
        $el.on('keypress', function(e) {
            if (e.keyCode == 13) {
                $doc.trigger(events.WORD_DETAIL, [$el.find('a[name="detailLink"]')[0]]);
            }
        });
        $el.find('span[name="starIcon"]')
            .on('click', async function() {
                removeWord.bind(this)(data.topic_id);
            });
        $el.find('span[name="accentIcon"]')
            // use global singleton audio tag to avoid exceeding audio count limits
            // https://chromium-review.googlesource.com/c/chromium/src/+/2816118
            .on('click', () => loadAndPlayAccent(audioSrc));
        $el.find('a[name="detailLink"]')
            .on('click', function(e) {  
                e.preventDefault();
                $doc.trigger(events.WORD_DETAIL, [this]);                    
            });
        $el.find('span[name="searchMeansSpan"]')
            .on('click', function(e) {
                let $this = $(this), masked = $this.data('masked');            
                $this.data('masked', !masked);
                $this.css('background', !masked ? '#6a6d71' : 'none');
            });
        $el.find('span[name="wordSpan"]')
            .on('click', function(e) {
                let $this = $(this), masked = $this.data('masked');                
                $this.data('masked', !masked);
                $this.removeClass().addClass(masked ? 'word-row' : 'word-row-hidden');
            });
    }

    function loadAndPlayAccent(audioSrc) {    
        if (currentAudioSrc != audioSrc) {        
            fetch(audioSrc, {method: 'GET', mode: 'cors'})
                    .then(resp => resp.arrayBuffer())
                    .then(arrayBuffer => {
                        currentAudioSrc = audioSrc;
                        audioBinaryData = arrayBuffer;
                        createAudioAndPlay(audioBinaryData.slice(0, audioBinaryData.byteLength))
                    });
        } else if (audioBinaryData) {
            createAudioAndPlay(audioBinaryData.slice(0, audioBinaryData.byteLength));
        }
    }

    function createAudioAndPlay(binaryData) {
        let context = getAudioContext();
        let source = context.createBufferSource();

        context.decodeAudioData(binaryData, (buffer) => {
            source.buffer = buffer
            source.connect(context.destination);
            source.start(0);
        });
    }

    function getAudioContext() {
        if (audioContext) return audioContext;

        return audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    function formatDate(timestamp) {
        let date = new Date(timestamp);
        let pad2 = (n) => {
            return (n < 10 ? '0' : '') + n;
        }

        return date.getFullYear()        + '-' +
               pad2(date.getMonth() + 1) + '-' +
               pad2(date.getDate())      + ' ' +
               pad2(date.getHours())     + ':' +
               pad2(date.getMinutes())   + ':' +
               pad2(date.getSeconds());
    }

    async function removeWord(topicId) {
        let successful;
        try {
            successful = await cancelCollectWord(topicId);
        } catch(e) {
            successful = false;
            console.error(`取消收藏单词 ${topicId} 异常`, e);
            window.Analytics.fireErrorEvent(e, { message: '取消收藏单词失败' });
        }

        if (!successful) {
            return alert('取消收藏单词失败');
        }

        $(this).parent().parent().hide(500);

        WordbookStorage.remove(topicId);
    }

    function generateErrorTips() {
        let $el = $(`
            <tr>
                <td>加载失败，请稍后重试</td>
            </tr>
        `);
        let $tbody = $('#wordbookContentTable > tbody');

        $tbody.empty().append($el);
    }

    async function generateWordbooks(e, data) {
        let selectedBookId = await storageModule.get('bookId');
        let html = data.user_books.map(book => 
            `<option value="${book.user_book_id}" ${book.user_book_id == selectedBookId ? 'selected' : ''}>
                ${book.book_name}(已收录 ${book.word_num} 词)
            </option>`
        )
        .join('');

        $('#wordbookSelect').html(html);
    }

    function clearStorageWords() {
        WordbookStorage.clear();
    }

    function refreshWordDetail(e, triggerEl) {
        if (!triggerEl) return;
        
        let $triggerEl = $(triggerEl);
        let topicId = $triggerEl.data('topic-id');
        currentWordDetailIndex = parseInt($triggerEl.parent().parent().attr('tabindex'));

        window.Analytics.fireEvent('wordDetail', { topicId });
        getWordDetail(topicId)
            .then(data => {
                let $modal = $('#wordDetailModal').modal('show')
                                .on('hide.bs.modal', (e) => currentWordDetailIndex = -1);
                generateWordDetail(data, $modal.find('.modal-body'), true, true);
            });
    }

    function maskMeans(e) {        
        let $this = $(this);
        let $means = $('#wordbookContentTable > tbody > tr span[name="searchMeansSpan"]');
        let masked = $this.prop('checked');

        $means.css('background', masked ? '#6a6d71' : 'none');
        $means.data('masked', masked);
    }

    function maskEnglish(e) {
        let $this = $(this);
        let $means = $('#wordbookContentTable > tbody > tr span[name="wordSpan"]');
        let masked = $this.prop('checked');

        $means.removeClass().addClass(masked ? 'word-row-hidden' : 'word-row');
        $means.data('masked', masked);
    }

    async function refreshWordbookTable(e) {
        e.preventDefault();

        let $this = $(this);

        $this.parent()
            .find('.btn-outline-primary')
            .removeClass('btn-outline-primary')
            .addClass('btn-outline-secondary');
        $this.removeClass('btn-outline-secondary')
            .addClass('btn-outline-primary');
            
        loadWordbookTable(false);
    }

    function bindShortcutKey(e) {
        if (e.code === 'ArrowRight' && currentWordDetailIndex !== -1) {
            e.preventDefault();
            $doc.trigger(events.WORD_DETAIL, $(`tr[tabindex=${currentWordDetailIndex + 1}] > td > a`)[0]);
        }

        if (e.code === 'ArrowLeft' &&  currentWordDetailIndex !== -1) {
            e.preventDefault();
            $doc.trigger(events.WORD_DETAIL, $(`tr[tabindex=${currentWordDetailIndex - 1}] > td > a`)[0]);
        }
    }

    async function getAllWords() {
        try {
            const allWords = await WordbookStorage.loadAllWords();
            
            // 可以按时间排序
            allWords.sort((a, b) => b.created_at - a.created_at);
            
            return allWords;
        } catch(e) {
            console.error('获取所有单词失败', e);
            window.Analytics.fireErrorEvent(e, { message: '获取所有单词失败' });
            return [];
        }
    }

    window.wordbookModule = {init};
} (this, document, jQuery));