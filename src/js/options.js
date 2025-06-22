;(function(window, document, $) {
    'use strict';

    const $doc = $(document);
    const { Toast } = window.__baicizhanHelperModule__;

    async function init() {
        loginModule.init();
        settingModule.init();
        wordbookModule.init();
        studyModule.init();
        ankiOptionsModule.init();
        initToast();
        initTrial();
        window.Analytics.firePageViewEvent('options page', 'options.html');   

        let accessToken = await storageModule.get('accessToken');
        let event = accessToken ? events.AUTHED : events.UNAUTHED;

        $doc.trigger(event);
    }

    function initToast() {        
        const $toastElement = new Toast(); 
        $toastElement.init();

        $doc.on(events.ACCESS_DENIED, (event, ex) => {
            $toastElement.alert(ex.message);
        });
    }

    async function initTrial() {
        try {
            let isTrial = await apiModule.hasTrial();

            if (!isTrial) {            
                $('#chargeHref').tooltip('show');
            }
        } catch (error) {
            console.error('检查试用信息失败:', error);
        }
    }

    window.onload = init;
} (this, document, jQuery));