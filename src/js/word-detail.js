;(function(window) {
    'use strict';

    const {collectWord, cancelCollectWord} = window.apiModule;
    const resourceDomain = 'https://7n.bczcdn.com';
    let collected = false;

    function generateWordDetail(data, $target, hasCollected) {        
        $target.empty().css('display', 'block');
        collected = hasCollected || false;
        
        generateWordInfo(data.dict, $target);
        generateSentence(data.dict.sentences, $target);
        generateEnglishParaphrase(data.dict.en_means, $target);
    }

    function generateWordInfo(data, $parent) {        
        let starIconSvg = collected ? 'star-fill.svg' : 'star.svg'; 
        let $section = $(`
            <div class="section">
                <span class="word">${data.word_basic_info.word}</span>
                <span id="starIcon" class="star">
                    <img src="../svgs/${starIconSvg}">
                </span>
                <br>                
            </div>
        `);        
        
        generateAccent(data.word_basic_info, $section);
        generateMeansTable(data.chn_means, $section);

        $section.appendTo($parent);
        $section.find('#starIcon').on('click', function() {
            favoriteWord.bind(this)(data.word_basic_info.topic_id)
        });
    }

    function favoriteWord(topicId) {
        let fn = !collected ? collectWord : cancelCollectWord;
        let tips = !collected ? '收藏' : '取消收藏';

        fn(topicId).then(response => {
            if (response) {
                collected = !collected;
                let starIconSvg = collected ? 'star-fill.svg' : 'star.svg';                

                $(this).html(`<img src="../svgs/${starIconSvg}">`);
                return;
            }

            console.log(`${tips}失败`);
        })
        .catch(e => console.error(`${tips}异常`, e));
    }

    function generateAccent(data, $parent) {
        let html = `
            <span>${data.accent_uk}</span>
            <span id="accentUkIcon" class="volume-up">
                <img src="../svgs/volume-up.svg">
            </span>
            <audio id="accentUkAudio" style="display: none;"><source src="${resourceDomain + data.accent_uk_audio_uri}"></audio>
        `;

        if (data.accent_uk != data.accent_usa) {
            html += `
                <span>${data.accent_usa}</span>
                <span id="accentUsaIcon" class="volume-up">
                    <img src="../svgs/volume-up.svg">
                </span>
                <audio id="accentUsaAudio" style="display: none;"><source src="${resourceDomain + data.accent_usa_audio_uri}"></audio>
            `;
        }

        $(html).appendTo($parent);
        $parent.find('#accentUkIcon').on('click', () => $('#accentUkAudio')[0].play());
        $parent.find('#accentUsaIcon').on('click', () => $('#accentUsaAudio')[0].play());
    }

    function generateMeansTable(data, $parent) {
        let chineseMeans = data.reduce((prev, curr) => {
            prev[curr.mean_type] = prev[curr.mean_type] || [];
            prev[curr.mean_type].push(curr.mean);

            return prev;
        }, Object.create(null));
        let $el = $(`
            <table class="means-table">
                ${
                    Object.entries(chineseMeans)
                        .map(([k, v]) => `
                            <tr>
                                <td><span class="badge bg-primary" style="color: white;">${k}</span></td>
                                <td>${v.join(';')}</td>
                            </tr>
                        `)
                        .join('')
                }
            </table>
        `);  
        
        $el.appendTo($parent);
    }

    function generateSentence(data, $parent) {
        if (data.length === 0) return;

        let sentence = data[Math.floor(Math.random() * data.length)];
        let $el = $(`
            <div class="section">
                <p style="font-weight: bolder;">图文例句</p>
                <span>${sentence.sentence}</span>
                <span id="phreaseAccentIcon" class="volume-up">
                    <img src="../svgs/volume-up.svg">
                </span>
                <audio id="phraseAudio" style="display: none;"><source src="${resourceDomain + sentence.audio_uri}"></audio>
                <br>
                <p style="color: #6a6d71;">${sentence.sentence_trans}</p>
                <img style="max-width: 200px;" src="${resourceDomain + sentence.img_uri}" />
            </div>
        `);

        $el.appendTo($parent);
        $el.find('#phreaseAccentIcon').on('click', () => $('#phraseAudio')[0].play());
    }

    function generateEnglishParaphrase(data, $parent) {
        if (data.length === 0) return;

        let englishMeans = data.reduce((prev, curr) => {
            prev[curr.mean_type] = prev[curr.mean_type] || [];
            prev[curr.mean_type].push(curr.mean);

            return prev;
        }, Object.create(null));
        let $el = $(`
            <div class="section">
                <p style="font-weight: bolder;">英文释义</p>
                ${
                    Object.entries(englishMeans)
                        .map(([k, v]) => `
                            <span class="badge bg-primary" style="color: white;">${k}</span><br>
                            <ul style="padding-left: 15px;">
                                ${v.map(m => `<li>${m}</li>`).join('')}
                            </ul>
                        `)
                        .join('')
                }
            </div>
        `);

        $el.appendTo($parent);
    }

    window.generateWordDetail = generateWordDetail;
} (this));