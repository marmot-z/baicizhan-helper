;(function(window, document, $) {
    'use strict';

    const $doc = $(document);
    const {getBookWords, cancelCollectWord, getWordDetail} = window.apiModule;

    function init() {
        $doc.on(events.AUTHED, (e) => loadWorkbookTable(false));        
        $doc.on(events.BOOKS_LOADED, generateWorkbooks);
        $doc.on(events.UNAUTHED, clearStorageWords);
        $('#workbookRefreshButton').on('click', (e) => loadWorkbookTable(true));
    }

    async function loadWorkbookTable(focus) {
        let bookId = $('#workbookSelect').val() || 0;

        try {
            let workbookData = focus ?
                    await loadFromServer(bookId) :
                    await loadFromLocal(bookId) || await loadFromServer(bookId);

            generateWorkbookTable(workbookData);
        } catch(e) {
            console.error(`加载单词本 ${bookId} 内容错误`, e);
            generateErrorTips();
        }
    }

    function loadFromServer(bookId) {
        return getBookWords(bookId).then(data => {
            storageModule.set('workbookContent', data);

            return data;
        });
    }

    function loadFromLocal() {
        return storageModule.get('workbookContent');
    }

    function generateWorkbookTable(data) {
        let $tbody = $('#workbookContentTable > tbody').empty();

        data.sort((a, b) => b.created_at - a.created_at);

        for (let item of data) {
            generateWordRow(item, $tbody);
        }
    }

    function generateWordRow(data, $parent) {
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
                        <source src="${data.audio_uk}">
                    </audio>
                    <span style="font-size: x-small; color: #a1a5ab;">收藏时间：${formatAsYYYYMMDDHHMMSS(data.created_at)}</span>
                    <a name="detailLink" href="#" style="float: right; color: #606266;">详情 > </a> <br>
                    <span class="searchMeans" title="${data.mean}">${data.mean}</span>
                </td>
            </tr> 
        `);

        $el.appendTo($parent);
        $el.find('span[name="starIcon"]').on('click', async function() {
            removeWork.bind(this)(data.topic_id);
        });
        $el.find('span[name="accentIcon"]').on('click', () => $el.find('audio')[0].play());
        $el.find('a[name="detailLink"]').on('click', () => {            
            getWordDetail(data.topic_id)
                .then(data => {
                    let $modal = $('#wordDetailModal').modal('show');
                    generateWordDetail(data, $modal.find('.modal-body'), true);
                    $modal.find('#starIcon').hide();
                });
        });
    }

    function formatAsYYYYMMDDHHMMSS(timestamp) {
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

    async function removeWork(topicId) {
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

        refreshStorageWords(topicId);
    }

    async function refreshStorageWords(topicId) {
        let workbookContent = await loadFromLocal();
        let collectedWords = workbookContent.filter(word => word.topic_id != topicId);

        storageModule.set('workbookContent', collectedWords);
    }

    function generateErrorTips() {
        let $el = $(`
            <tr>
                <td>加载失败，请稍后重试</td>
            </tr>
        `);
        let $tbody = $('#workbookContentTable > tbody');

        $tbody.empty().append($el);
    }

    function generateWorkbooks(e, data) {
        let html = data.user_books.map(book => 
            `<option value="${book.user_book_id}">${book.book_name}(已收录 ${book.word_num} 词)</option>`
        )
        .join('');

        $('#workbookSelect').html(html);
    }

    function clearStorageWords() {
        storageModule.remove(['workbookContent']);
    }

    window.workbookModule = {init};
} (this, document, jQuery));