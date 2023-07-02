;(function(window, $) {
    'use strict';

    const {searchWord, getWordDetail} = window.apiModule;    

    function search() {
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

        for (let item of data) {
            generateWordRow(item, $tbody);
        }
    }

    function generateWordRow(data, $parent) {
        let $el = $(`
            <tr style="cursor: pointer;">
                <td>
                    <span class="searchWord">${data.word}</span> &nbsp;&nbsp;
                    <span class="searchAccent">${data.accent}</span>
                    <span class="searchMeans" title="${data.mean_cn}">${data.mean_cn}</span>
                </td>
            </tr>
        `);

        $el.appendTo($parent);
        $el.on('click', () => detail(data.topic_id));
    }

    function generateErrorTips($parent) {
        let $errorTipsRow = $(`
            <tr>
                <td>查询失败，请稍候再试</td>
            </tr>
        `);

        $parent.empty().append($errorTipsRow);
    }

    function detail(topicId) {
        getWordDetail(topicId)
            .then((data) => {
                $('#searchTable').css('display', 'none');
                generateWordDetail(data, $('#detailDiv'));
            })
            .catch((e) => {
                console.error(e);
                generateErrorTips($('#detailDiv'));
            });
    }

    function init() {
        $('#searchButton').on('click', search);
        $('#searchInput').on('keypress', (e) => {
            if (e.keyCode == 13) {
                search();
            }
        });
    }

    window.onload = init;
} (this, jQuery));