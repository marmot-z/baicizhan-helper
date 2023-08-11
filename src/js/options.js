;(function(window, document, $) {
    'use strict';

    const $doc = $(document);

    async function init() {
        loginModule.init();
        settingModule.init();
        wordbookModule.init();
        
        let accessToken = await storageModule.get('accessToken');
        let event = accessToken ? events.AUTHED : events.UNAUTHED;

        $doc.trigger(event);

        $('#joinLink').on('click', (e) => {
            e.preventDefault();            
            alert(
                '如果你对插件使用有疑问，或是要提些建议，亦或是单纯的想交个朋友，那就快加入我们的讨论群吧！\n' +
                '添加我的微信：zxw1536711318（请备注：百词斩助手）。'
            );
        });
    }

    window.onload = init;
} (this, document, jQuery));