;(function(window, document, $) {
    'use strict';

    const $doc = $(document);
    const {searchWord, getWordDetail} = window.apiModule;

    function search() {
        $doc.off('keydown');
        let content = $('#searchInput').val().trim();
        
        if (!content) return;

        searchWord(content)
            .then(generateWordList)
            .catch((e) => {
                console.error(e);
                generateErrorTips($('#searchTable > tbody'));
            });
    }

    function generateWordList(data) {
        let $tbody = $('#searchTable > tbody');

        $tbody.empty().parent().css('display', 'block');
        $('#detailDiv').css('display', 'none');
        
        data.forEach((item, index) => generateWordRow(item, $tbody, index))
    }

    function generateWordRow(data, $parent, index) {
        let $el = $(`
            <tr style="cursor: pointer;" tabIndex="${++index}" data-topic-id="${data.topic_id}">
                <td>
                    <span class="searchWord">${data.word}</span> &nbsp;&nbsp;
                    <span class="searchAccent">${data.accent}</span>
                    <span class="searchMeans" title="${data.mean_cn}">${data.mean_cn}</span>
                </td>
            </tr>
        `);

        $el.appendTo($parent);
        $el.on('click', function(e) {
            $doc.trigger(events.WORD_DETAIL, [this]);
        });
        $el.on('keypress', function(e) {
            if (e.keyCode === 13) $doc.trigger(events.WORD_DETAIL, [this]);
        });
    }

    function generateErrorTips($parent) {
        let $errorTipsRow = $(`
            <tr>
                <td>查询失败，请稍候再试</td>
            </tr>
        `);

        $parent.empty().append($errorTipsRow);
    }

    function refreshWordDetail(e, triggerEl) {
        let topicId = $(triggerEl).data('topic-id');

        getWordDetail(topicId)
            .then((data) => {
                $('#searchTable').css('display', 'none');
                generateWordDetail(data, $('#detailDiv'), data.dict.word_basic_info.__collected__);
            })
            .catch((e) => {
                console.error(e);
                generateErrorTips($('#detailDiv'));
            });
    }

    function init() {
        initNav();
        initSearch();
    }

    function initSearch() {
        $('#searchButton').on('click', search);
        $('#searchInput').focus().on('keypress', (e) => {
            if (e.keyCode == 13) search();
        });
        $doc.on(events.WORD_DETAIL, refreshWordDetail);
    }

    function initNav() {
        let $reviewNav = $('#reviewNav');
        let $searchNav = $('#searchNav');
        let $searchDiv = $('#searchDiv');
        let $reviewDiv = $('#reviewDiv');

        $reviewNav.on('click', (e) => {
            e.preventDefault();
            $reviewNav.addClass('disabled');  
            $searchNav.removeClass('disabled');
            $searchDiv.hide();
            $reviewDiv.show();
        });
        $('#searchNav').on('click', (e) => {
            e.preventDefault();
            $searchNav.addClass('disabled');  
            $reviewNav.removeClass('disabled');
            $reviewDiv.hide();
            $searchDiv.show();       
        }); 
    }

    window.onload = init;
} (this, document, jQuery));