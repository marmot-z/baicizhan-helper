;(function(window, $) {
    'use strict';

    // 亮色弹窗模板
    const TEMPLATE = `
        <div class="webui-popover translate-content">
            <div class="webui-arrow"></div>
            <div class="webui-popover-inner">
                <a href="#" class="close"></a>
                <h3 class="webui-popover-title"></h3>
                <div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div>
            </div>
        </div>
    `;
    // 暗黑弹窗模板
    const DARK_TEMPLATE = `
        <div class="webui-popover-dark translate-content">
            <div class="webui-arrow"></div>
            <div class="webui-popover-inner">
                <a href="#" class="close"></a>
                <h3 class="webui-popover-title"></h3>
                <div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div>
            </div>
        </div>
    `;
    // 百词斩资源主机名
    const BAICIZHAN_RESOURCE_HOST = 'https://7n.bczcdn.com';
    // 单词词性缩写与中文对照
    const wordClass = { 
        'a.'     : '形容词',
        'c.'     : '可数名词',
        'n.'     : '名词',
        'u.'     : '不可数名词',
        'v.'     : '动词',
        'pl.'    : '复数',
        'vi.'    : '不及物动词',
        'vt.'    : '及物动词',
        'adv.'   : '副词',
        'adj.'   : '形容词',
        'num.'   : '数词',        
        'art.'   : '冠词',
        'int.'   : '感叹词',
        'pron.'  : '代词',
        'prep.'  : '介词',
        'conj.'  : '连词',
        'abbr.'  : '缩写',
        'auxv.'  : '助动词',
        'interj.': '感叹词',
        'link-v.': '联系动词' 
    };
    /**
     * css 样式集合，用于将 class 转换为行内样式
     * @see ../assets/baicizhan-helper.css
     */
    const lightCssMap = {
        'translate-content': {'min-width': '240px'},
        'title': {'margin-bottom': '0px;'},
        'accent': {
            'font-size': 'small',
            'color': '#606266',
            'margin-top': '2px',
            'white-space': 'nowrap'
        },
        'star': {
            'float': 'right',
            'cursor': 'pointer',
            'font-size': 'large'
        },
        'sound-size': {'cursor': 'pointer'},
        'means-table': {
            'table-layout': 'auto',
            'border-collapse': 'separate',
            'border-spacing': '0 8px',
        },
        'data-cell-first': {
            'text-align': 'left',
            'min-width': '40px',
            'padding-right': '5px',
            'color': '#636363',
            'font-style': 'italic'
        },
        'data-cell': {
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
            'word-wrap': 'break-word'
        },
        'sentence': {'padding-top': '2px'},
        'sentence-img': {'width': '180px'},
        'sentence-p': {'margin': '3px 0'}
    };
    const darkCssMap = JSON.parse(JSON.stringify(lightCssMap));
    ['title', 'accent', 'data-cell-first', 'data-cell', 'sentence-p'].forEach(key => 
        Object.assign(darkCssMap[key], {'filter': 'invert(90%) hue-rotate(180deg)'})
    );

    function MyWebuiPopover(options = {}) { 
        this.options = options;
        this.data = this.options.wordInfo;        
        this.$el = this.options.$el;            
        this.inited = false;

        this.$el.css('display', 'block');        
        this.$el.webuiPopover({
            title: generateTtitle(this.data, this.options.theme),
            content: generateContent(this.data, this.options.popoverStyle, this.options.theme),
            trigger: options.trigger || 'click',
            mutil: options.multi || false,
            template: this.options.theme == 'dark' ? DARK_TEMPLATE : TEMPLATE,
            onShow: ($popover) => !this.inited && this._initEvent($popover),
            onHide: () => {
                this.$el.css('display', 'none');
                audioContext && audioContext.close();
            }
        });
    }

    /**
     * 生成标题
     * @param {Object} data 单词数据
     * @returns 标题 html 
     */
    function generateTtitle(data, theme = 'light') {
        let assetPathPrefix = `chrome-extension://${chrome.runtime.id}/assets`;
        let wordInfo = data.word_basic_info;
        let titleHtml = `
            <p class="title">
                ${wordInfo.word}
                <span id="starIcon" class="star">
                    <img src="${assetPathPrefix}/star.svg" />
                </span>
            </p>`;
        let accentHtml = wordInfo.accent_usa != wordInfo.accent_uk ?
            `<p class="accent">
                ${wordInfo.accent_uk} 
                <span id="accentUkAudio" class="sound-size"><img src="${assetPathPrefix}/sound-size.svg"/></span>
                ${wordInfo.accent_usa} 
                <span id="accentUsaAudio" class="sound-size""><img src="${assetPathPrefix}/sound-size.svg"/></span>` :
            `<p class="accent">
                ${wordInfo.accent_uk}
                <span id="accentUkAudio" class="sound-size"><img src="${assetPathPrefix}/sound-size.svg"/></span>
            </p>`;

        return replaceCss2style(titleHtml + accentHtml, theme);
    } 

    function replaceCss2style(html, theme) {
        let darkTheme = theme == 'dark';

        return html.replace(/class="([\w-]*?)"/ig, (match, g1) => {
            let cssMap = darkTheme ? darkCssMap : lightCssMap;

            return cssMap[g1] ?
                `style="${Object.entries(cssMap[g1]).map(([k,v]) => `${k}: ${v};`).join('')}"` :
                match;
        });
    }

    /**
     * 生成弹窗内容
     * @param {Object} data 单词数据
     * @param {String} style 弹窗样式
     * @returns 内容 html
     */
    function generateContent(data, style = 'simple', theme = 'light') {
        let meansHtml, graphicHtml;
        let chineseMeans = data.chn_means.reduce((prev, curr) => {
            prev[curr.mean_type] = prev[curr.mean_type] || [];
            prev[curr.mean_type].push(curr.mean);

            return prev;
        }, Object.create(null));

        meansHtml = `
            <table class="means-table">
                ${
                    Object.entries(chineseMeans)
                                .map(([k, v]) => `
                                    <tr>
                                        <td class="data-cell-first">${wordClass[k] || k}</td>
                                        <td class="data-cell">${v.join(';&nbsp;')}</td>
                                    </tr>
                                `)
                                .join('')
                }
            </table>
            `;

        if (style == 'graphic') {
            let sentence = data.sentences[0];
            let assetPathPrefix = `chrome-extension://${chrome.runtime.id}/assets`;

            if (sentence) {
                graphicHtml = `
                    <div class="sentence">
                        <img class="sentence-img" src="${BAICIZHAN_RESOURCE_HOST}${sentence.img_uri}"></img>
                        <p class="sentence-p">
                            ${sentence.sentence}
                            <span id="sentenceAudio" class="sound-size"><img src="${assetPathPrefix}/sound-size.svg" /></span>
                        </p>
                        <p class="sentence-p">${sentence.sentence_trans}</p>
                    </div>
                `;

                return replaceCss2style(meansHtml + graphicHtml, theme);
            }            
        }

        return replaceCss2style(meansHtml, theme);
    }

    MyWebuiPopover.prototype._initEvent = function($popover) {
        let titleShadow = $popover.find('.webui-popover-title').get(0).shadowRoot;
        let starIcon = titleShadow.querySelector('#starIcon');
        let accentUkAudio = titleShadow.querySelector('#accentUkAudio');
        let accentUsaAudio = titleShadow.querySelector('#accentUsaAudio');
        let contentShadow = $popover.find('.webui-popover-content').get(0).shadowRoot;
        let sentenceAudio = contentShadow.querySelector('#sentenceAudio');

        if (accentUsaAudio) {
            accentUsaAudio.addEventListener('click', 
                loadAudio(titleShadow, BAICIZHAN_RESOURCE_HOST + this.data.word_basic_info.accent_usa_audio_uri));
        }

        if (accentUkAudio) {
            accentUkAudio.addEventListener('click', 
                loadAudio(titleShadow, BAICIZHAN_RESOURCE_HOST + this.data.word_basic_info.accent_uk_audio_uri));
        }

        if (sentenceAudio) {
            sentenceAudio.addEventListener('click', 
                loadAudio(contentShadow, BAICIZHAN_RESOURCE_HOST + this.data?.sentences[0]?.audio_uri));
        }

        if (starIcon) {
            let fn = (e) => {
                e.preventDefault();

                this.options.collectWord(this.data.word_basic_info.word)
                    .then(successful => {
                        starIcon.style['cursor'] = 'not-allowed';

                        // 更新 star 图标样式
                        let assetPathPrefix = `chrome-extension://${chrome.runtime.id}/assets`;                  
                        starIcon.querySelector('img').src = successful?.data ? 
                            `${assetPathPrefix}/star-filled.svg` : 
                            `${assetPathPrefix}/star-disabled.svg`;
                    });
                
                starIcon.removeEventListener('click', fn);
            };

            starIcon.addEventListener('click', fn);
        }

        this.inited = true;
    };

    function loadAudio(parent, audioSrc) {
        let loaded = false, binaryData;

        return (e) => {
            e.preventDefault();

            if (!loaded) {    
                fetch(audioSrc, {method: 'GET', mode: 'cors'})
                .then(resp => resp.arrayBuffer())
                .then(arrayBuffer => createAudioAndPlay((binaryData = arrayBuffer).slice(0, binaryData.byteLength)));

                loaded = true;
            }

            if (binaryData) {
                createAudioAndPlay(binaryData.slice(0, binaryData.byteLength));
            }
        };
    }

    function createAudioAndPlay(binaryData) {
        let context = getAudioContext();
        let source = context.createBufferSource();

        context.decodeAudioData(binaryData, (buffer) => source.buffer = buffer);
        source.connect(context.destination);
        source.start(0);
    }

    // 可复用的音频 context
    let audioContext;

    function getAudioContext() {
        return audioContext || (audioContext = new AudioContext());
    }

    MyWebuiPopover.prototype.show = function() {
        this.$el.webuiPopover('show');
    };

    MyWebuiPopover.prototype.hide = function() {
        this.$el.webuiPopover('hide');
    };

    MyWebuiPopover.prototype.destory = function() {
        // 销毁辅助元素
        this.$el.webuiPopover('destroy');
        this.$el.css('display', 'none');
        audioContext = null;
    };

    window.MyWebuiPopover = MyWebuiPopover;
}) (this, jQuery);