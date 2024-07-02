;(function(window, document, $) {
    'use strict';

    const resourceDomain = 'https://7n.bczcdn.com';
    const template = `
        <div class="webui-popover translate-content">
            <div class="webui-arrow"></div>
            <div class="webui-popover-inner">
                <a href="#" class="close"></a>
                <h3 class="webui-popover-title"></h3>
                <div class="webui-popover-content" style="min-width: 360px;"><i class="icon-refresh"></i> <p>&nbsp;</p></div>
            </div>
        </div>
    `;
    const {EnglishStemmer, levenshtein, webuiPopoverClassMap} = window.__baicizhanHelperModule__;
    const replaceCss2style = window.__baicizhanHelperModule__.replaceCss2style.bind(webuiPopoverClassMap);
    const stemmer = new EnglishStemmer();
    let audioContext;

    function WordWebuiPopover(options) {
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
            placement: 'auto-bottom',
            onShow: ($popover) => !this.inited && this.init($popover),
            onHide: () => {            
                this.$el.css('display', 'none');
                audioContext && audioContext.close();
                this.options.onHide();
            }
        });
    }

    function generateTitle(data) {
        let svgPath = `chrome-extension://${chrome.runtime.id}/svgs`;
        let wordInfo = data.word_basic_info;
        let svg = wordInfo.__collected__ ? 
            svgPath + '/star-fill.svg' :
            svgPath + '/star.svg';
        let titleHtml = `
            <p class="title">
                <span class="word">${wordInfo.word}</span>
                <span id="starIcon" class="star">
                    <img src="${svg}"/>
                </span>
            </p>`;
        let volumeIconHtml = `<img src="${svgPath}/volume-up.svg"/>`;
        let accentHtml = wordInfo.accent_usa != wordInfo.accent_uk ?
            `<p class="accent">
                英&nbsp;${wordInfo.accent_uk} 
                <span id="accentUkAudio" class="sound-size">${volumeIconHtml}</span>
                美&nbsp;${wordInfo.accent_usa} 
                <span id="accentUsaAudio" class="sound-size"">${volumeIconHtml}</span>` :
            `<p class="accent">
                英&nbsp;${wordInfo.accent_uk}
                <span id="accentUkAudio" class="sound-size">${volumeIconHtml}</span>
            </p>`;

        return replaceCss2style(titleHtml + accentHtml);
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
                                        <td class="data-cell-first">${k}</td>
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
        let sentenceHtml = highlight(sentence, data.word_basic_info.word);  
        let svgPath = `chrome-extension://${chrome.runtime.id}/svgs`;        

        return `
            <div class="sentence">
                <img class="sentence-img" src="${resourceDomain}${sentence.img_uri}"></img>
                <p class="sentence-p">
                    ${sentenceHtml}
                    <span id="sentenceAudio" class="sound-size">
                        <img src="${svgPath}/volume-up.svg"/>
                    </span>
                </p>
                <p class="sentence-p">${sentence.sentence_trans}</p>
            </div>
        `;
    }

    function highlight(sentence, word) {
        if (sentence.highlight_phrase) {
            return sentence.sentence.replace(
                sentence.highlight_phrase, 
                `<span style="color: #007bff;">${sentence.highlight_phrase}</span>`
            );
        }

        let highlightWord = sentence.sentence.split(/\s/)
                .map(s => {
                    let regex = /[\w-]+/;

                    if (regex.test(s)) {
                        let term = s.match(regex)[0];
                        let distance = levenshtein(term, word);
                        let highlightable = term.length < 7 ? distance <= 3 : distance <= 5;

                        if (highlightable) {
                            return [distance, term];
                        }
                    }

                    return null;
                })
                .filter(pair => pair !== null)
                .reduce((a, b) => a[0] < b[0] ? a : b);

        if (!highlightWord) {
            return sentence.sentence;
        }
        
        let replaceRegex = new RegExp(`\\b${highlightWord[1]}\\b`, 'g');

        return sentence.sentence.replace(replaceRegex, (match) => {
            return `<span style="color: #007bff;">${match}</span>`;
        });
    }

    Object.assign(WordWebuiPopover.prototype, {
        init: function($popover) {
            let titleShadow = $popover.find('.webui-popover-title').get(0).shadowRoot;
            let starIcon = titleShadow.querySelector('#starIcon');
            let accentUkAudio = titleShadow.querySelector('#accentUkAudio');
            let accentUsaAudio = titleShadow.querySelector('#accentUsaAudio');
            let contentShadow = $popover.find('.webui-popover-content').get(0).shadowRoot;
            let sentenceAudio = contentShadow.querySelector('#sentenceAudio');

            // 收藏快捷键事件注册
            if (this.options.collectShortcutkey && this.options.collectShortcutkey.trim()) {
                $(document).off('keydown')
                    .on('keydown', null, this.options.collectShortcutkey.toLowerCase(), 
                            collectWord(starIcon, this.$el, this.data, this.data.word_basic_info.__collected__));
            }

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
                starIcon.addEventListener('click', 
                    collectWord(starIcon, this.$el, this.data, this.data.word_basic_info.__collected__));
            }

            this.inited = true;
            // 隐藏辅助元素，防止元素遮挡选中文本，
            // 造成文本不可选中，不可右键查询
            this.$el.css('display', 'none');
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

    function collectWord(el, $supportEl, data, initCollected) {
        let collected = initCollected;

        return (e) => {
            e.preventDefault();

            let action = collected ? 'cancelCollectWord' : 'collectWord';
            let arg = collected ? data.word_basic_info.topic_id : data;
            let tips = collected ? '取消收藏' : '收藏';

            sendRequest({
                action,
                args: arg
            })
            .then(response => {                                        
                if (response) {
                    collected = !collected;
                    let svgPath = `chrome-extension://${chrome.runtime.id}/svgs`;
                    let starIconSvgPath = collected ? `${svgPath}/star-fill.svg` : `${svgPath}/star.svg`;

                    $(el).html(`<img src="${starIconSvgPath}"/>`);
                    $supportEl.trigger('baicizhanHelper:alert', [`${tips}成功`]);
                } else {
                    $supportEl.trigger('baicizhanHelper:alert', [`${tips}失败！`]);
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

    if (!window.__baicizhanHelperModule__) {
        window.__baicizhanHelperModule__ = {};
    }

    window.__baicizhanHelperModule__.WordWebuiPopover = WordWebuiPopover;
} (this, document, jQuery));