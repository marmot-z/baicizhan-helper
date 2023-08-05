;(function(window, document, $) {
    'use strict';

    const $doc = $(document);
    const resourceDomain = 'https://7n.bczcdn.com';
    const {getBookWords, cancelCollectWord, getWordDetail} = window.apiModule;
    const {WordbookStorage} = window.wordbookStorageModule;

    function init() {
        $doc.on(events.AUTHED, (e) => loadWordbookTable(false));        
        $doc.on(events.BOOKS_LOADED, generateWordbooks);
        $doc.on(events.UNAUTHED, clearStorageWords);
        $doc.on(events.WORD_DETAIL, refreshWordDetail);
        $('#wordbookSelect').on('change', (e) => loadWordbookTable(false));
        $('#wordbookRefreshButton').on('click', (e) => loadWordbookTable(true));
    }

    async function loadWordbookTable(focus) {
        let bookId = $('#wordbookSelect').val() || 0;

        try {
            let wordbookData = focus ?
                    await loadFromServer(bookId) :
                    await loadFromLocal(bookId) || await loadFromServer(bookId);

            generateWordbookTable(wordbookData);
        } catch(e) {
            console.error(`加载单词本 ${bookId} 内容错误`, e);
            generateErrorTips();
        }
    }

    function loadFromServer(bookId) {
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

        data.sort((a, b) => b.created_at - a.created_at);

        for (let item of data) {
            generateWordRow(item, $tbody);
        }
    }

    function generateWordRow(data, $parent) {
        let audioSrc = data.audio_uk.startsWith('http') ?
                data.audio_uk :
                resourceDomain + data.audio_uk;
        let $el = $(`
            <tr>
                <td>
                    <span name="starIcon" style="cursor: pointer;">
                        <img src="../svgs/star-fill.svg" />
                    </span>
                </td>
                <td>
                    <span style="font-weight: bolder;">${data.word}</span> &nbsp;&nbsp;
                    <span name="accentIcon" style="cursor: pointer;">
                        <img src="../svgs/volume-up.svg" />
                    </span>
                    <audio name="accentAudio" style="display: none;">
                        <source src="${audioSrc}">
                    </audio>
                    <span style="font-size: x-small; color: #a1a5ab;">收藏时间：${formatDate(data.created_at)}</span>
                    <a name="detailLink" href="#" data-topic-id="${data.topic_id}" style="float: right; color: #606266;">详情 > </a> <br>
                    <span class="searchMeans" title="${data.mean}">${data.mean}</span>
                </td>
            </tr> 
        `);

        $el.appendTo($parent);
        $el.find('span[name="starIcon"]').on('click', async function() {
            removeWord.bind(this)(data.topic_id);
        });
        $el.find('span[name="accentIcon"]').on('click', () => $el.find('audio')[0].play());
        $el.find('a[name="detailLink"]').on('click', function(e) {  
            e.preventDefault();
            $doc.trigger(events.WORD_DETAIL, [this]);                    
        });
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

    function generateWordbooks(e, data) {
        let html = data.user_books.map(book => 
            `<option value="${book.user_book_id}">${book.book_name}(已收录 ${book.word_num} 词)</option>`
        )
        .join('');

        $('#wordbookSelect').html(html);
    }

    function clearStorageWords() {
        WordbookStorage.clear();
    }

    function refreshWordDetail(e, triggerEl) {
        let topicId = $(triggerEl).data('topic-id');

        getWordDetail(topicId)
            .then(data => {
                let $modal = $('#wordDetailModal').modal('show');
                generateWordDetail(data, $modal.find('.modal-body'), true, false);
                $modal.find('#starIcon').hide();
            });
    }

    window.wordbookModule = {init};
} (this, document, jQuery));