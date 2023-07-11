;(function(window, document, $) {
    'use strict';

    const defaultDelay = 3000;
    const cssMap = window.__baicizhanHelperModule__.toastCssMap;
    const replaceCss2style = window.__baicizhanHelperModule__.replaceCss2style.bind(cssMap);

    function Toast(options = {}) {
        let iconSrc = `chrome-extension://${chrome.runtime.id}/icon.png`;
        let html = `                
            <div id="__baicizhanHelperToast__" class="baicizhanHelperToast toast show">
                <div class="toast-header">
                    <img src="${iconSrc}" class="rounded mr-2">
                    <strong class="mr-auto">Baicizhan-helper</strong>
                </div>
                <div class="toast-body"></div>
            </div>
        `;

        this.options = options;
        this.html = replaceCss2style(html);
    }

    Toast.prototype.init = function() {
        this.$el = $(this.html);
        this.$el.appendTo(document.body);
    };

    Toast.prototype.alert = function(message) {
        this.$el.find('div:nth-child(2)').html(message);
        this.$el.css('display', 'block');
        this.$el.fadeIn(100);

        let delay = this.options.delay || defaultDelay;
        this.$el.delay(delay).fadeOut(500);
    };

    if (!window.__baicizhanHelperModule__) {
        window.__baicizhanHelperModule__ = {};
    }

    window.__baicizhanHelperModule__.Toast = Toast;
} (this, document, jQuery));