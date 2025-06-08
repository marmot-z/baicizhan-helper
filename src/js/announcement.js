; (function (window, document, $) {
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
                            <p>尊敬的用户：</p>
                            <p>感谢您一直以来对本插件的关注与支持。为了持续提升服务质量、保障插件的稳定运营，并为您带来更优质的使用体验，我们将于即日起实行收费机制。</p>
                            <p>收费标准如下：</p>
                            <ul>
                            <li>月度会员：2元/月</li>
                            <li>半年会员：8元/6个月</li>
                            <li>年度会员：12元/12个月</li>
                            </ul>
                            <p>您可根据自身需求选择适合的套餐，享受会员权益。付费会员将优先获得插件新功能体验、专属客服支持及更多定制化服务。<a href="/src/charge.html" target="_blank">>>>去购买</a></p>
                            <p>如您在使用过程中有任何疑问或建议，欢迎随时与我们联系。</p>
                            <p>再次感谢您的理解与支持！</p>
                        </div>
                    </div>
                </div>
            </div>`;

    function showQuestionnarie() {
        const $modal = $(questionnaire_template_html).appendTo('body');

        $modal.find('.btn-close').on('click', function () {
            $modal.modal('hide');
            storageModule.set('announcement.close.v2.0.0', true);
        });

        $modal.modal('show');
    }

    function initAnnouncementIfNecessary() {
        storageModule.get('announcement.close.v2.0.0')
            .then((result) => {
                if (!result) {
                    window.Analytics.fireEvent('loadAnnouncement', {});
                    showQuestionnarie();
                }
            });
    }

    window.announcementModule = { init: initAnnouncementIfNecessary };
})(this, document, jQuery);