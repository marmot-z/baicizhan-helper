;(function(window, document, $) {
    'use strict';

    const $doc = $(document);

    async function init() {
        loginModule.init();
        settingModule.init();
        wordbookModule.init();
        studyModule.init();
        ankiOptionsModule.init();
        announcementModule.init();
        window.Analytics.firePageViewEvent('options page', 'options.html');   

        let accessToken = await storageModule.get('accessToken');
        let event = accessToken ? events.AUTHED : events.UNAUTHED;

        $doc.trigger(event);
    }

    window.onload = init;
} (this, document, jQuery));