;(function(window, document, $) {
    'use strict';

    const $doc = $(document);

    async function checkUpgrade() {
        let latestVersion = await apiModule.getLatestVersion();
        let currentVersion = window.__baicizhanHelper__.version;
        let hasNewVersion = latestVersion > currentVersion;

        if (hasNewVersion) {
            let $tips = $('#versionTips');
            $tips.find('strong').text(currentVersion);
            $tips.show();            
        }
    }

    async function init() {
        loginModule.init();
        settingModule.init();
        wordbookModule.init();
        studyModule.init();
        checkUpgrade();

        let accessToken = await storageModule.get('accessToken');
        let event = accessToken ? events.AUTHED : events.UNAUTHED;

        $doc.trigger(event);
    }

    window.onload = init;
} (this, document, jQuery));