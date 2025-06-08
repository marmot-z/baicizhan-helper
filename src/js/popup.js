;(function(window, document, $) {
    'use strict';

    const $doc = $(document);
    const {searchWord, getWordDetail} = window.apiModule;
    const ankiService = new AnkiService();

    function search() {
        $doc.off('keydown');
        let content = $('#searchInput').val().trim();
        
        if (!content) return;

        window.Analytics.fireEvent('searchWord', { word: content });
        searchWord(content)
            .then(generateWordList)
            .catch((e) => {
                console.error(e);
                generateErrorTips($('#searchTable > tbody'), e);
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

    function generateErrorTips($parent, e) {
        let errorMsg;
        if (e && e instanceof AccessDeniedException) {
            errorMsg = `您尚未开通会员,<a href="./charge.html" target="_blank">去开通</a>`;
        } else {
            errorMsg = '查询失败，请稍候再试';
        }

        $parent.empty().append(`<tr><td>${errorMsg}</td></tr>`);
        window.Analytics.fireErrorEvent(new Error('搜索单词失败'), { message: '搜索单词失败' });
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

    async function init() {
        window.Analytics.firePageViewEvent('search page', 'popup.html');
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

    async function exportToAnki(word) {
        try {
            // First check if Anki is running and accessible
            await ankiService.invoke('version');
            
            // Create deck if it doesn't exist
            await ankiService.createDeck('English Vocabulary');
            
            const wordData = await getWordDetails(word); // Your existing function to get word details
            
            // Add note to Anki
            await ankiService.addNote(
                wordData.word,
                wordData.phonetic,
                wordData.meaning,
                wordData.image,
                wordData.sentence
            );

            // Show success message
            showMessage('Successfully exported to Anki!');
        } catch (error) {
            showMessage('Failed to export to Anki. Make sure Anki is running with AnkiConnect installed.');
            console.error('Anki export error:', error);
            window.Analytics.fireErrorEvent(error, { message: '导出单个单词到anki失败' });
        }
    }

    function addAnkiExportButton(wordElement) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'anki-export-btn';
        exportBtn.innerHTML = '<i class="fas fa-file-export"></i>';
        exportBtn.title = 'Export to Anki';
        exportBtn.onclick = () => exportToAnki(wordElement.textContent);
        wordElement.appendChild(exportBtn);
    }

    window.onload = init;
} (this, document, jQuery));