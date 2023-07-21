;(function(window) {
    'use strict';

    let webuiPopoverClassMap = {
        'translate-content': {
            'min-width': '240px'
        },
        'title': {
            'margin-bottom': '0px;'
        },
        'word': {
            'color': 'black',
            'font-size': '18px',
            'line-height': '18px',
            'font-weight': '700',
        },
        'accent': {
            'font-size': 'small',
            'color': '#606266',
            'margin-top': '2px',
            'white-space': 'nowrap',
            'font-size': '14px',
        },
        'star': {
            'float': 'right',
            'cursor': 'pointer',
            'font-size': 'large'
        },
        'sound-size': {
            'cursor': 'pointer'
        },
        'means-table': {
            'table-layout': 'auto',
            'border-collapse': 'separate',
            'border-spacing': '0 2px'
        },
        'data-cell-first': {
            'text-align': 'left',
            'min-width': '40px',
            'padding-right': '5px',
            'color': '#636363',
            'font-style': 'italic',
            'font-weight': '400',
            'font-size': '14px',
        },
        'data-cell': {
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'word-wrap': 'break-word',
            'font-size': '14px',
            'font-weight': '400',
            'color': 'black',
        },
        'sentence': {
            'padding-top': '2px'
        },
        'sentence-img': {
            'width': '180px'
        },
        'sentence-p': {
            'margin': '3px 0',
            'font-size': '14px',
            'font-weight': '400',
            'color': 'black',
        }
    };
    let toastCssMap = {
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
            'color': 'black'
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
    };

    function replaceCss2style(html) {
        return html.replace(/class="([\w-\s]*?)"/ig, (match, g1) => {
            let csses = g1.split(/\s/);
            let styles = csses.flatMap(css => 
                !this[css] ?
                    '' :
                    Object.entries(this[css]).map(([k,v]) => `${k}: ${v};`)
            )
            .join('');

            return `style="${styles}"`;
        });
    }
    
    if (!window.__baicizhanHelperModule__) {
        window.__baicizhanHelperModule__ = {};
    }

    window.__baicizhanHelperModule__.replaceCss2style = replaceCss2style;
    window.__baicizhanHelperModule__.toastCssMap = toastCssMap;
    window.__baicizhanHelperModule__.webuiPopoverClassMap = webuiPopoverClassMap;    
} (this));