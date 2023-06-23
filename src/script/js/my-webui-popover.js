;(function(window) {
    'use strict';

    const resourceDomain = 'https://7n.bczcdn.com';
    const template = `
        <div class="webui-popover translate-content">
            <div class="webui-arrow"></div>
            <div class="webui-popover-inner">
                <a href="#" class="close"></a>
                <h3 class="webui-popover-title"></h3>
                <div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div>
            </div>
        </div>
    `;
    const wordClass = {"a.":"形容词","c.":"可数名词","n.":"名词","u.":"不可数名词","v.":"动词","pl.":"复数","vi.":"不及物动词","vt.":"及物动词","adv.":"副词","adj.":"形容词","num.":"数词","art.":"冠词","int.":"感叹词","pron.":"代词","prep.":"介词","conj.":"连词","abbr.":"缩写","auxv.":"助动词","interj.":"感叹词","link-v.":"联系动词"};
    const cssMap = {"translate-content":{"min-width":"240px"},"title":{"margin-bottom":"0px;"},"accent":{"font-size":"small","color":"#606266","margin-top":"2px","white-space":"nowrap"},"star":{"float":"right","cursor":"pointer","font-size":"large"},"sound-size":{"cursor":"pointer"},"means-table":{"table-layout":"auto","border-collapse":"separate","border-spacing":"0 8px"},"data-cell-first":{"text-align":"left","min-width":"40px","padding-right":"5px","color":"#636363","font-style":"italic"},"data-cell":{"overflow":"hidden","text-overflow":"ellipsis","word-wrap":"break-word"},"sentence":{"padding-top":"2px"},"sentence-img":{"width":"180px"},"sentence-p":{"margin":"3px 0"}};
    let audioContext;

    function MyWebuiPopover(options) {
        this.options = options;
        this.data = this.options.wordInfo;        
        this.$el = this.options.$el;            
        this.inited = false;

        this.$el.css('display', 'block');        
        this.$el.webuiPopover({
            title: generateTitle(this.data),
            content: generateContent(this.data, this.options.popoverStyle),
            trigger: options.trigger || 'click',
            mutil: options.multi || false,
            template: template,
            onShow: ($popover) => !this.inited && this.init($popover),
            onHide: () => {
                this.$el.css('display', 'none');
                audioContext && audioContext.close();
            }
        });
    }

    function generateTitle(data) {
        let svgPath = `chrome-extension://${chrome.runtime.id}/svgs`;
        let wordInfo = data.word_basic_info;
        let titleHtml = `
            <p class="title">
                ${wordInfo.word}
                <span id="starIcon" class="star">
                    <img src="${svgPath}/star.svg"/>
                </span>
            </p>`;
        let volumeIconHtml = `<img src="${svgPath}/volume-up.svg"/>`;
        let accentHtml = wordInfo.accent_usa != wordInfo.accent_uk ?
            `<p class="accent">
                ${wordInfo.accent_uk} 
                <span id="accentUkAudio" class="sound-size">${volumeIconHtml}</span>
                ${wordInfo.accent_usa} 
                <span id="accentUsaAudio" class="sound-size"">${volumeIconHtml}</span>` :
            `<p class="accent">
                ${wordInfo.accent_uk}
                <span id="accentUkAudio" class="sound-size">${volumeIconHtml}</span>
            </p>`;

        return replaceCss2style(titleHtml + accentHtml);
    }

    function replaceCss2style(html) {
        return html.replace(/class="([\w-]*?)"/ig, (match, g1) => {
            return cssMap[g1] ?
                `style="${Object.entries(cssMap[g1]).map(([k,v]) => `${k}: ${v};`).join('')}"` :
                match;
        });
    }

    function generateContent(data, style = 'simple') {
        let meansHtml = generateMeansHtml(data);
        let sentenceHtml = generateSentenceHtml(data, style);

        return replaceCss2style(meansHtml + sentenceHtml);
    }

    function generateMeansHtml(data) {
        let chineseMeans = data.chn_means.reduce((prev, curr) => {
            prev[curr.mean_type] = prev[curr.mean_type] || [];
            prev[curr.mean_type].push(curr.mean);

            return prev;
        }, Object.create(null));

        return `
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
    }

    function generateSentenceHtml(data, style) {
        if (style == 'simple') return '';
        if (!data.sentences[0]) return '';

        let sentence = data.sentences[0];
        let svgPath = `chrome-extension://${chrome.runtime.id}/svgs`;        

        return `
            <div class="sentence">
                <img class="sentence-img" src="${resourceDomain}${sentence.img_uri}"></img>
                <p class="sentence-p">
                    ${sentence.sentence}
                    <span id="sentenceAudio" class="sound-size">
                        <img src="${svgPath}/volume-up.svg"/>
                    </span>
                </p>
                <p class="sentence-p">${sentence.sentence_trans}</p>
            </div>
        `;
    }

    Object.assign(MyWebuiPopover.prototype, {
        init: function($popover) {
            let titleShadow = $popover.find('.webui-popover-title').get(0).shadowRoot;
            let starIcon = titleShadow.querySelector('#starIcon');
            let accentUkAudio = titleShadow.querySelector('#accentUkAudio');
            let accentUsaAudio = titleShadow.querySelector('#accentUsaAudio');
            let contentShadow = $popover.find('.webui-popover-content').get(0).shadowRoot;
            let sentenceAudio = contentShadow.querySelector('#sentenceAudio');

            if (accentUsaAudio) {
                accentUsaAudio.addEventListener('click', 
                    loadAudio(resourceDomain + this.data.word_basic_info.accent_usa_audio_uri));
            }

            if (accentUkAudio) {
                accentUkAudio.addEventListener('click', 
                    loadAudio(resourceDomain + this.data.word_basic_info.accent_uk_audio_uri));
            }

            if (sentenceAudio) {
                sentenceAudio.addEventListener('click', 
                    loadAudio(resourceDomain + this.data?.sentences[0]?.audio_uri));
            }

            if (starIcon) {
                starIcon.addEventListener('click', collectWord(starIcon, this.$el, this.data.word_basic_info.word));
            }

            this.inited = true;
        },
        show: function() {
            this.$el.webuiPopover('show');
        },
        hide: function() {
            this.$el.webuiPopover('hide');
        },
        destory: function() {
            this.$el.webuiPopover('destroy');
            this.$el.css('display', 'none');
            audioContext = null;
        }
    });

    function loadAudio(audioSrc) {
        let loaded = false, binaryData;

        return (e) => {
            e.preventDefault();

            if (!loaded) {    
                fetch(audioSrc, {method: 'GET', mode: 'cors'})
                    .then(resp => resp.arrayBuffer())
                    .then(arrayBuffer => 
                        createAudioAndPlay((binaryData = arrayBuffer).slice(0, binaryData.byteLength)));

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

        context.decodeAudioData(binaryData, (buffer) => {
            source.buffer = buffer
            source.connect(context.destination);
            source.start(0);
        });
    }

    function getAudioContext() {
        if (audioContext) return audioContext;

        return audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    function collectWord(el, $supportEl, word) {
        return (e) => {
            e.preventDefault();

            sendRequest({
                action: 'collectWord',
                args: [word]
            })
            .then(response => {                
                if (response) {
                    let svgPath = `chrome-extension://${chrome.runtime.id}/svgs`;
                    $(el).html(`<img src="${svgPath}/star-fill.svg"/>`);
                    $supportEl.trigger('baicizhanHelper:alert', ['收藏成功']);
                } else {
                    $supportEl.trigger('baicizhanHelper:alert', ['收藏失败！']);
                }
            })
            .catch(e => {
                $supportEl.trigger('baicizhanHelper:alert', [e.message]);
            });
        };
    }

    function sendRequest(option) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(option, (result) => {
                // 以 [Error]: 开头代表请求报错
                if (typeof result === 'string' && result.startsWith('[Error]:')) {
                    return reject(new Error(result.substring(8)));
                } 

                resolve(result);
            });
        });
    }

    window.MyWebuiPopover = MyWebuiPopover;
} (this));