;(function(window, doc, $) {
    'use strict';

    const events = window.events;
    const apiModule = window.apiModule;
    const storageModule = window.storageModule;

    async function enableStudy() {
        let bookPlanInfos = await apiModule.getSelectBookPlanInfo();

        if (bookPlanInfos.length === 0) {
            return;
        }

        let bookPlanInfo = bookPlanInfos[0];
        let localBookPlanInfo = await storageModule.get('bookPlanInfo');

        if (bookPlanInfo.book_id !== localBookPlanInfo?.book_id) {
            // 拉取学习书籍信息
            let allBookInfo = await apiModule.getAllBookInfo();
            let bookMap = Object.groupBy(allBookInfo.books_info, ({id}) => id);
            let bookInfo = bookMap[bookPlanInfo.book_id]?.[0];

            storageModule.set('bookPlanInfo', Object.assign(bookPlanInfo, bookInfo));

            // 单词本内全部单词
            let bookWords = await apiModule.getRoadmaps(bookPlanInfo.book_id);
            storageModule.set('bookWords', bookWords);

            // 已学单词列表
            let learnedWords = await apiModule.getLearnedWords(bookPlanInfo.book_id);
            storageModule.set('learnedWords', learnedWords);
            storageModule.set('loadLearnedWordsTimestamp', new Date().getTime());
        } else {
            bookPlanInfo = localBookPlanInfo;
        }

        generateStudyBookCard(bookPlanInfo);
    }

    function generateStudyBookCard(bookInfo) {
        let $studyBookDiv = $('#studyBookDiv');
        $studyBookDiv.find('img').attr('src', bookInfo.img);
        $studyBookDiv.find('.card-title').text(bookInfo.name);
        $studyBookDiv.find('.card-text:first').text(bookInfo.desc);
        $studyBookDiv.find('.card-text:last .text-muted').html(
            `每日学习 ${bookInfo.daily_plan_count} 新词，复习 ${bookInfo.review_plan_count} 词<br>（进度: ${bookInfo.learned_words_count} / ${bookInfo.total_words_count}）`);

        $studyBookDiv.show();
    }

    function disableStudy() {
        $('#studyBookDiv').hide();
    }

    window.studyModule = {
      init: () => {
          $(doc).on(events.ENABLE_STUDY, enableStudy)
              .on(events.DISABLE_STUDY, disableStudy);
      }
    };
}) (this, document, jQuery);