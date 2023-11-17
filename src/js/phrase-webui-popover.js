;(function(window, $) {
    'use strict';

    function PhraseWebuiPopover(options) {        
        this.$el = options.$el;

        this.$el.css('display', 'block');
        this.$el.webuiPopover({
            content: generateContent(options.translation),
            placement: 'auto-bottom',
            onHide: () => {            
                this.$el.css('display', 'none');
                options.onHide();
            }
        });
    }

    function generateContent(translation) {
        const styles = {
            'margin-top': '20px',
            'color': 'black',
            'font-size': 'medium',
            'font-weight': '400',
            'font-family': 'auto',
        };
        const stylesText = Object.entries(styles)
            .map(([k, v]) => `${k}: ${v}`)
            .join(';');

        return `<p style="${stylesText}">${translation}</p>`;
    }

    Object.assign(PhraseWebuiPopover.prototype, {
        show: function() {
            this.$el.webuiPopover('show');
        },
        hide: function() {
            this.$el.webuiPopover('hide');
        },
        destory: function() {
            this.$el.webuiPopover('destroy');
            this.$el.css('display', 'none');
        }
    });

    if (!window.__baicizhanHelperModule__) {
        window.__baicizhanHelperModule__ = {};
    }

    window.__baicizhanHelperModule__.PhraseWebuiPopover = PhraseWebuiPopover;
} (this, jQuery));