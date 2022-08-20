;(function(window) {
    'use strict';

    var GLOBAL_GROUP_ID = 1;

    function Group(options) {
        this.$parent = options.$parent;
        this.items = Array.isArray(options.items) ?
            options.items :
            Array.from(options.items).map($);    
        this.groupId = GLOBAL_GROUP_ID++;
        this.triggerBy = options.triggerBy;
        this.isActive = options.isActive;   
        this.onActive = options.onActive;
        this.onNegative = options.onNegative; 

        this.addEventPublisher();
        this.$parent.on('toggle' + this.groupId, this.toggle.bind(this));
    }

    Group.prototype.addEventPublisher = function() {
        var that = this;
        this.items.forEach(function(item) {
            item.on(that.triggerBy, function() {
                that.$parent.trigger('toggle' + that.groupId, [item]);
            });
        });
    }

    Group.prototype.toggle = function(event, triggerItem) {
        event.stopPropagation();

        for (var item of this.items) {
            if (this.isActive(item)) {
                this.onNegative && this.onNegative(item);
            }

            if (triggerItem === item) {
                this.onActive && this.onActive(item);
            }
        }
    };

    function getUserBooks() {
        baicizhanHelper.Utils.ajaxGet({url: baicizhanHelper.PROXY_HOST + '/books'})
            .then(books => {
                new BookList(books).render();
            })
            .catch(err => {
                // TODO 页面进行错误提示
            });
    }

    var BOOK_LIST_HTML_TEMPLATE = '<ul class="list-group book-list">${bookItemsHtml}</ul>';
    var BOOK_IITEM_HTML_TEMPLATE = '<div class="list-group-item book-itm">' +
                '&nbsp;' +
                '<label>' +
                '    <input type="checkbox" book-id="${bookId}">' +
                '</label>' +
                '&nbsp;&nbsp;&nbsp;' +
                '<div style="display: inline-block;">' +
                '    <img src="${imageUrl}" class="img-rounded">' +
                '</div>' +
                '&nbsp;&nbsp;&nbsp;' +
                '<span class="list-group-item-text">' +
                '    <span style="font-size: large;">${bookTitle}</span>' +
                '    <span style="font-size: medium;">（已收录&nbsp;${wordCount}&nbsp;词）</span>' +
                '</span>' +
            '</div>';

    function BookList(books) {
        this.books = books;
    }

    BookList.prototype.render = function() {
        // 渲染单词本项
        var itemsHtml = this.books.user_books.map(this.renderItem).join('');
        var listHtml = BOOK_LIST_HTML_TEMPLATE.replaceAll('${bookItemsHtml}', itemsHtml);

        $('#bookSettingView').append(listHtml);

        this.group = new Group({
            $parent: $('.list-group'),
            items: $('[type=checkbox]'),
            triggerBy: 'click',
            isActive: function($el) {
                return $el.prop('checked');
            },
            onActive: function($el) {
                $el.prop('checked', true);
                storageBookId(Number.parseInt($el.attr('book-id')));
            },
            onNegative: function($el) {
                $el.prop('checked', false);
            }
        });

        this.renderCheckedStatus();
    }

    BookList.prototype.renderItem = function(book) {
        return BOOK_IITEM_HTML_TEMPLATE.replaceAll('${imageUrl}', book.cover)
                .replaceAll('${bookTitle}', book.book_name)
                .replaceAll('${wordCount}', book.word_num)
                .replaceAll('${bookId}', book.user_book_id)
    }

    BookList.prototype.renderCheckedStatus = function() {
        if (typeof baicizhanHelper.selectedBookId !== 'number') {
            return;
        }

        for (var item of this.group.items) {
            var bookId = item.attr('book-id');

            if (bookId == baicizhanHelper.selectedBookId) {
                item.prop('checked', true);
            }
        }
    }

    function storageBookId(bookId) {
        chrome.storage.local.set({'baicizhanHelper.selectedBookId': bookId});
        baicizhanHelper.selectedBookId = bookId;
    }

    function initialElementEvent() {
        new Group({
            $parent: $('.menu'),
            items: $('.menu > li'),
            triggerBy: 'click',
            isActive: function($el) {
                return $el.hasClass('active');
            },
            onActive: function($el) {
                $el.addClass('active');
                $('#' + $el.attr('for')).trigger('show');
            },
            onNegative: function($el) {
                $el.removeClass('active');
            }
        });

        new Group({
            $parent: $('#settingView > .row'),
            items: [$('#bookSettingView'), $('#cardSettingView'), $('#advanceSettingView')],
            triggerBy: 'show',
            isActive: function($el) {
                return !$el.hasClass('hidden');
            },
            onActive: function($el) {
                $el.removeClass('hidden');
            },
            onNegative: function($el) {
                $el.addClass('hidden');
            }
        });

        getUserBooks();
    }

    $('body').one('toggleSettingView', initialElementEvent);
}) (this);