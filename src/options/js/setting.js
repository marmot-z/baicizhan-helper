;(function(window, $) {
    'use strict';

    const {getBooks} = window.apiModule;

    function loadWorkbook() {
        return getBooks().then(data => {
            let html = data.user_books.map(book => 
                `<option value="${book.user_book_id}">${book.book_name}(已收录 ${book.word_num} 词)</option>`
            )
            .join('');

            $('#workbookSelect').html(html);
        })
        .catch(e => console.error('加载单词本失败', e));
    }

    function loadSettings() {
        storageModule.get('bookId')
            .then(bookId => $('#workbookSelect').val(bookId || 0));
        storageModule.get('popoverStyle')
            .then(popoverStyle => {
                if (!popoverStyle) return;                
                $('input[name="popoverStyle"]').filter(`[value=${popoverStyle}]`).prop("checked", true)
            });
        storageModule.get('triggerMode')
            .then(triggerMode => {
                if (!triggerMode) return;                
                $('input[name="triggerMode"]').filter(`[value=${triggerMode}]`).prop("checked", true)
            });
        storageModule.get('theme')
            .then(theme => {
                if (!theme) return;
                $('input[name="theme"]').filter(`[value=${theme}]`).prop("checked", true)
            });
        storageModule.get('host')
            .then(host => $('#hostInput').val(host || apiModule.defaultHost));
        storageModule.get('port')
            .then(port => $('#portInput').val(port || apiModule.defaultPort));
    }

    function reset() {
        $('#workbookSelect').val('0');
        $('input[name="popoverStyle"]').first().prop("checked", true);
        $('input[name="triggerMode"]').first().prop("checked", true);
        $('input[name="theme"]').first().prop("checked", true);
        $('#hostInput').val(apiModule.defaultHost);
        $('#portInput').val(apiModule.defaultPort);
    }

    function save() {
        let bookId = $('#workbookSelect').val();
        let popoverStyle = $('input[name="popoverStyle"]:checked').val();
        let triggerMode = $('input[name="triggerMode"]:checked').val();
        let theme = $('input[name="theme"]:checked').val();
        let host = $('#hostInput').val();
        let port = $('#portInput').val();

        storageModule.set('bookId', bookId);
        storageModule.set('popoverStyle', popoverStyle);
        storageModule.set('triggerMode', triggerMode);
        storageModule.set('theme', theme);
        storageModule.set('host', host);
        storageModule.set('port', port);
    }

    function init() {
        loadWorkbook().finally(loadSettings);

        $('#resetButton').on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            reset();
        });
        $('#submitButton').on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            save();
            alert('保存成功');
        });
    }

    window.settingModule = {init};
} (this, jQuery));