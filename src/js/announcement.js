;(function (window, document, $) {
    'use strict';

    const questionnaire_template_html = `<div class="modal" id="questionnarieModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">公告</h5>
                            <button type="button" class="btn-close" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>大家好，不知不觉，百词斩助手已经上线将近三年了。最初，它只是一个为自己学习英语而开发的小工具，后来觉得或许也能对更多人有所帮助，于是将插件发布在了应用商店。一路走来，收获了许多用户的肯定与鼓励，衷心感谢每一位使用和支持它的朋友。</p>
                            <p>这三年来，我始终坚持免费提供服务，并尽力对插件进行维护和优化。但随着用户数量的增长，服务器和数据存储等方面的支出也不断增加，加之个人时间和精力有限，继续无偿维护的压力越来越大。为了让这个工具能够持续、稳定地运行下去，我决定对插件收取一定的费用。</p>
                            <p>收费标准为约 <b>2 元/月</b>，插件将于 <b>2025 年 6 月 14</b> 日起开始收费。感谢您的理解与支持，希望百词斩助手能继续在你的英语学习之路上陪伴左右。</p>                        
                        </div>
                    </div>
                </div>
            </div>`;

    function showQuestionnarie() {
        const $modal = $(questionnaire_template_html).appendTo('body');

        $modal.find('.btn-close').on('click', function() {
            $modal.modal('hide');
            storageModule.set('announcement.close', true);
        });

        $modal.modal('show');
    }

    function initAnnouncementIfNecessary() {
        storageModule.get('announcement.close')
            .then((result) => {
                if (!result) {
                    window.Analytics.fireEvent('loadAnnouncement', {});
                    showQuestionnarie();
                }
            });
    }

    window.announcementModule = {init: initAnnouncementIfNecessary};
}) (this, document, jQuery);