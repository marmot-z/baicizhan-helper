;(function(window, document, $) {
    'use strict';

    const $doc = $(document);

    function initWechatQrCode() {
        storageModule.get(['host', 'port'])
            .then(([host, port]) => {
                $('#qrCodeImg').webuiPopover({
                    placement: 'left',
                    type: 'html',
                    trigger: 'hover',
                    content: `<img src="http://${host}:${port}/qrcode.jpg" style="width: 250px; height: 375px;"/>`
                });
            });
    }

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
        initWechatQrCode();
        checkUpgrade();

        let accessToken = await storageModule.get('accessToken');
        let event = accessToken ? events.AUTHED : events.UNAUTHED;

        $doc.trigger(event);
    }

    window.onload = init;
} (this, document, jQuery));