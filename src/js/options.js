;(function(window, document, $) {
    'use strict';

    const $doc = $(document);

    async function init() {
        loginModule.init();
        settingModule.init();
        workbookModule.init();
        
        let accessToken = await storageModule.get('accessToken');

        if (!accessToken) {
            $doc.trigger(events.UNAUTHED);
        } else {
            $doc.trigger(events.AUTHED);
        }
    }

    window.onload = init;
} (this, document, jQuery));