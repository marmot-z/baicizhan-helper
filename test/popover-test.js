const template =  `
<div class="webui-popover translate-content">
    <div class="webui-arrow"></div>
    <div class="webui-popover-inner">
        <a href="#" class="close"></a>
        <h3 class="webui-popover-title"></h3>
        <div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div>
    </div>
</div>
`;

const wordClass = {
    'adv': '副词',
    'adj': '形容词',
    'n': '名词',
    'v': '动词',
    'auxv': '助动词',
    'link-v': '联系动词' 
};                

// 各种格式的数据
let good = {
    word: 'good',
    accents: {
        accent_uk: '/ɡʊd/',
        accent_usa: '/ɡʊd/',
        audios: {}
    },
    chineseMeans: {
        adj: ['令人满意的', '有利的', '熟练的', '好的'],
        adv: ['好地'],
        n: ['善行', '好处', '美德']
    },
    sentence: {
        sentence: 'She said I did a good job.',
        sentence_trans: '她说我干得不错。',
        img_url: 'https://7n.bczcdn.com/r/1423913156278.jpg'
    }
};
let be = {
    word: 'be',
    accents: {
        accent_usa: '/bi/',
        accent_uk: '/bi/'
    },
    chineseMeans: {
        v: ['出席', '到场', '位于', '在（某处）', '留在（某地）', '逗留', '有', '存在', '（某时或某地）发生',
        '（仅用于完成时）前往', '造访', '访问', '出生于（某地）', '来自...', '是（某地的）人', '得', '要', 
        '表示，意味是', '等于，值', '成为，变成'],
        auxv: ['与动词的现在分词连用，构成各种进行时态', '与及物动词的过去分词连用，构成被动语态'],
        'link-v': ['等于', '等同']
    },
    sentence: {
        sentence: 'The woman is a doctor.',
        sentence_trans: '这位女士是一名医生。',
        img_url: 'https://7n.bczcdn.com/r/d4861f2cff4a28398cfe2328fc822a9e_77515_1665462761.jpg'
    }
};
let courage = {
    word: 'courage',
    accents: {
        accent_usa: '/ˈkɜːrɪdʒ/',
        accent_uk: '/ˈkʌrɪdʒ/'
    },
    chineseMeans: {
        n: ['勇气，胆量']
    },
    sentence: {
        sentence: 'This man has a lot of courage to jump.',
        sentence_trans: '这个男人有勇气往下跳。',
        img_url: 'https://7n.bczcdn.com/r/i_24_16665_0_4_20150808231837.jpg'
    }
};
let Pneumonoultramicroscopicsilicovolcanoconiosis = {
    word: 'Pneumonoultramicroscopicsilicovolcanoconiosis',
    accents: {
        accent_usa: "/'nju:mənəʊ ˌʌltrə-ˌmaɪkrəs' kɒpɪk'sɪlɪkəvɒl'keɪnəʊ kəʊnɪ'əʊsɪs/",
        accent_uk: "/'nju:mənəʊ ˌʌltrə-ˌmaɪkrəs' kɒpɪk'sɪlɪkəvɒl'keɪnəʊ kəʊnɪ'əʊsɪs/"
    },
    chineseMeans: {
        n: ['硅酸盐沉着病', '矽肺病']
    },
    sentence: {
        sentence: '',
        sentence_trans: '',
        img_url: ''
    }
};
let like = {
    word: 'like',
    accents: {
        accent_usa: '/laɪk/',
        accent_uk: '/laɪk/'
    },
    chineseMeans: {
        prep: ['像'],
        vt: ['喜欢'],
        adj: ['相似的'],
        n: ['相类似的人或物', '爱好'],
        conj: ['像……一样，如同', '好像，仿佛'],
        adv: ['（非正式口语，代替 as）和…一样，如','（非正式口语，思考说下句话、解释或举例时用）大概', '可能']
    },
    sentence: {
        sentence: "He looks like his father.How can I \"capture\" numbers of rows in TD? For example,I would like max two rows in TD. I can use substr, but this isn't good idea. Extra text let be cut off.",
        sentence_trans: '他看起来像他爸爸。',
        img_url: 'https://7n.bczcdn.com/r/986879189b261ef660b0b2a2e2c21c4f.jpeg'
    }
};
let fragment = {
    word: 'fragment',
    accents: {
        accent_usa: "/ˈfrægmənt/, /ˈfrægˌmɛnt/",
        accent_uk: "/ˈfræɡmənt/"
    },
    chineseMeans: {
        n: ['片段', '碎片（读作/ˈfrægmənt/）'],
        v: ['使成碎片（读作/ˈfrægˌmɛnt/）']
    },
    sentence: {}
};

function createSimpleWebuiPopover(selector, data, placement = 'bottom') {
    let $el = $(selector).webuiPopover({
        // TODO 返回带样式的标题 html
        title: generateTitle(data),
        // TODO 返回一个 shadow，shadow 中有一些样式
        content: generateSimpleContent(data),
        trigger: 'manual',
        multi: true,
        template,
        placement
    });

    $el.webuiPopover('show');
}

function createGraphicWebuiPopover(selector, data, placement = 'bottom') {
    let $el = $(selector).webuiPopover({
        title: generateTitle(data),
        content: generateGraphicContent(data),
        multi: true,
        template,
        trigger: 'manual',
        placement
    });

    $el.webuiPopover('show');
}

function generateTitle(data) {
    let titleHtml = `
        <p style="margin-bottom: 0px;">
            ${data.word}
            <span class="star">
                <img src="../src/content-scripts/assets/star.svg" />
            </span>
        </p>`;
    let accentHtml = data.accents.accent_uk != data.accents.accent_usa ?
        `<p class="accent">
            ${data.accents.accent_uk} <span class="sound-size"><img src="../src/content-scripts/assets/sound-size.svg" /></span>
            ${data.accents.accent_usa} <span class="sound-size""><img src="../src/content-scripts/assets/sound-size.svg" /></span>` :
        `<p class="accent">
            ${data.accents.accent_uk} <span class="sound-size"><img src="../src/content-scripts/assets/sound-size.svg" /></span>
        </p>`;

    return replaceCss2style(titleHtml + accentHtml);
}

const cssMap = {
    'translate-content': `min-width: 240px;`,
    'accent': `
        font-size: small;
        color: #606266;
        margin-top: 2px;
        white-space: nowrap;
    `,
    'star': `
        float: right;
        cursor: pointer;
        font-size: large;
    `,
    'sound-size': `
        cursor: pointer;
    `,
    'means-table': `
        table-layout: auto;
        border-collapse: separate;
        border-spacing: 0 8px; 
    `,
    'data-cell-first': `
        text-align: left;
        min-width: 40px;
        padding-right: 5px;
        color: #636363;
        font-style: italic;
    `,
    'data-cell': `
        overflow: hidden;
        text-overflow: ellipsis;
        word-wrap: break-word;
    `,
    'sentence': `padding-top: 2px;`,
    'sentence-img': `width: 180px;`,
    'sentence-p': `margin: 3px 0;`
};

function replaceCss2style(html, csses) {
    return html.replace(/class="([\w-]*?)"/ig, (match, g1) => 
            cssMap[g1] ? 
            `style="${cssMap[g1].trim().replace('\n', '')}"` : 
            match
    );
}

function generateSimpleContent(data) {
    let meansHtml = `
    <table class="means-table">
        ${
            Object.entries(data.chineseMeans)
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

    return replaceCss2style(meansHtml);
}

function generateGraphicContent(data) {
    let meansHtml = generateSimpleContent(data);
    let graphicHtml = `
        <div class="sentence">
            <img class="sentence-img" src="${data.sentence.img_url}"></img>
            <p class="sentence-p">${data.sentence.sentence}<span class="sound-size""><img src="../src/content-scripts/assets/sound-size.svg" /></p>
            <p class="sentence-p">${data.sentence.sentence_trans}</p>
        </div>
    `;

    return replaceCss2style(meansHtml + graphicHtml);
}

// 正常，简单模式
createSimpleWebuiPopover('#good1', good);
// 正常，图文模式
createGraphicWebuiPopover('#good2', good);
// 超窄，简单模式（最小宽度）
createSimpleWebuiPopover('#courage1', courage);
createGraphicWebuiPopover('#courage2', courage);
// 超宽，简单模式（最大宽度）
createSimpleWebuiPopover('#be1', be);
createGraphicWebuiPopover('#be2', be);
// 超短，简单模式（最小高度）
// 超长，简单模式
// 音标超长，简单模式
createSimpleWebuiPopover('#Pneumonoultramicroscopicsilicovolcanoconiosis1', Pneumonoultramicroscopicsilicovolcanoconiosis);
createSimpleWebuiPopover('#Pneumonoultramicroscopicsilicovolcanoconiosis2', Pneumonoultramicroscopicsilicovolcanoconiosis, 'right');
// 例句超长，简单模式
createSimpleWebuiPopover('#like1', like);
createGraphicWebuiPopover('#like2', like);
// 音标过长，简单模式
createSimpleWebuiPopover('#fragment', fragment);


// 验证 shadow dom 是否可以隔离页面的 css 影响
function createIsolateStyleText() {
    // shadow dom 附加节点
    const shadowDomRef = document.querySelector('#shadowDomRef1');

    // 创建 shadow dom
    let shadow = shadowDomRef.attachShadow({mode: 'open'});
    
    // 正常创建子元素
    let p = document.createElement('p');
    p.textContent = '这是一段不受外界样式影响的文本1';

    // 子元素添加到 shadow dom 中
    shadow.appendChild(p);
}

// 使用 jquery 创建 shadow dom
function createIsolateStyleTextWithJQuery() {
    // shadow dom 附加节点
    const shadowDomRef = document.querySelector('#shadowDomRef2');
    let shadow = shadowDomRef.attachShadow({mode: 'open'});

    let $p = $('<p>这是一段不受外界样式影响的文本2</p>');
    $p.appendTo(shadow);
}

createIsolateStyleText();
createIsolateStyleTextWithJQuery();