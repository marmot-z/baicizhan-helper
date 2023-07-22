;(function(window, document, $) {
    'use strict';

    const $doc = $(document);

    async function init() {
        loginModule.init();
        settingModule.init();
        workbookModule.init();
        
        let accessToken = await storageModule.get('accessToken');
        let event = accessToken ? events.AUTHED : events.UNAUTHED;

        $doc.trigger(event);
    }

    window.onload = init;
} (this, document, jQuery));