;(function(window, document, $) {
    'use strict';

    const defaultDelay = 3000;
    const cssMap = {
        'baicizhanHelperToast': {
            'position': 'fixed', 
            'top': '10px',
            'right': '10px', 
            'z-index': '9999',
            'min-width': '200px',
            'display': 'none',
        },
        'toast': {
            'flex-basis': '350px',
            'max-width': '350px',
            'font-size': '0.875rem',
            'background-color': 'rgba(255, 255, 255, 0.85)',
            'background-clip': 'padding-box',
            'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 0.25rem 0.75rem',
            'border-width': '1px',
            'border-style': 'solid',
            'border-color': 'rgba(0, 0, 0, 0.1)',
            'border-image': 'initial',
            'border-radius': '0.25rem',
        },
        'show': {
            'flex-basis': '350px',
            'max-width': '350px',
            'font-size': '0.875rem',
            'background-color': 'rgba(255, 255, 255, 0.85)',
            'background-clip': 'padding-box',
            'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 0.25rem 0.75rem',
            'border-width': '1px',
            'border-style': 'solid',
            'border-color': 'rgba(0, 0, 0, 0.1)',
            'border-image': 'initial',
            'border-radius': '0.25rem',
        },
        'fade': {
            'transition': 'opacity 0.15s linear 0s'
        },
        'toast-header': {
            'display': 'flex',
            'align-items': 'center',
            'color': 'rgb(108, 117, 125)',
            'background-color': 'rgba(255, 255, 255, 0.85)',
            'background-clip': 'padding-box',
            'border-top-left-radius': 'calc(0.25rem - 1px)',
            'border-top-right-radius': 'calc(0.25rem - 1px)',
            'padding': '0.25rem 0.75rem',
            'border-bottom': '1px solid rgba(0, 0, 0, 0.05)',
        },
        'toast-body': {
            'padding': '0.75rem',
        },
        'mr-auto': {
            'margin-right': 'auto !important',
        },
        'mr-2': {
            'margin-right': '0.5rem !important',
        },
        'rounded': {
            'border-radius': '0.25rem !important',
            'height': '20px', 
            'widht': '20px',
        }
    }

    function Toast(options = {}) {
        let iconSrc = `chrome-extension://${chrome.runtime.id}/icon.png`;
        let html = `                
            <div id="__baicizhanHelperToast__" class="baicizhanHelperToast toast show">
                <div class="toast-header">
                    <img src="${iconSrc}" class="rounded mr-2" style="height: 20px; widht: 20px;">
                    <strong class="mr-auto">Baicizhan-helper</strong>
                </div>
                <div class="toast-body">
                    Hello, world! This is a toast message.
                </div>
            </div>
        `;

        this.options = options;
        this.html = replaceCss2style(html);
    }

    function replaceCss2style(html) {
        return html.replace(/class="([\w-\s]*?)"/ig, (match, g1) => {
            let csses = g1.split(/\s/);
            let styles = csses.flatMap(css => 
                !cssMap[css] ?
                    '' :
                    Object.entries(cssMap[css]).map(([k,v]) => `${k}: ${v};`)
            )
            .join('');

            return `style="${styles}"`;
        });
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

    if (!window.__baicizhanHelperModule) {
        window.__baicizhanHelperModule = {};
    }

    window.__baicizhanHelperModule.Toast = Toast;
} (this, document, jQuery));