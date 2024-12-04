;(function(window, document) {
    'use strict';

    class ContentHighlighter {
        constructor() {
            this.collectedWords = new Set();
            this.popover = null;
            this.initialized = false;
            this.observer = null;
            this.highlightDebounceTimer = null;
            this.processedNodes = new WeakSet();
            this.MAX_HIGHLIGHT_WORDS = 1000;  // 最大高亮单词数
            this.isProcessing = false;
            this.originalOverflow = null;  // 保存原始的 overflow 样式
            this.debug = true;  // 开启调试模式
            this.highlightStyle = 'underline';  // 默认样式
            this.highlightColor = '#2196F3';    // 默认颜色
            
            // 默认配置
            this.defaultSettings = {
                enabled: true,
                style: 'underline',
                color: '#2196F3'
            };
            
            // 初始化设置
            this.highlightStyle = this.defaultSettings.style;
            this.highlightColor = this.defaultSettings.color;
            
            // 添加消息监听
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'updateHighlightSettings') {
                    if (message.enabled) {
                        this.highlightStyle = message.style || 'underline';
                        this.highlightColor = message.color || '#2196F3';
                        this.init();
                    } else {
                        this.removeHighlights();
                    }
                }
            });
        }

        async init() {
            // 检查是否已经有其他实例在运行
            if (window._contentHighlighterRunning) {
                console.log('Another ContentHighlighter instance is already running');
                return;
            }
            window._contentHighlighterRunning = true;

            console.log('ContentHighlighter init started');
            
            // 获取设置，如果没有则使用默认值
            const { highlightSettings } = await chrome.storage.local.get(['highlightSettings']);
            console.log('Highlight settings:', highlightSettings);
            
            // 如果是第一次使用，初始化默认设置
            if (!highlightSettings) {
                await chrome.storage.local.set({ highlightSettings: this.defaultSettings });
                this.highlightStyle = this.defaultSettings.style;
                this.highlightColor = this.defaultSettings.color;
            } else {
                if (!highlightSettings.enabled) {
                    console.log('Highlight feature is disabled');
                    return;
                }
                this.highlightStyle = highlightSettings.style || this.defaultSettings.style;
                this.highlightColor = highlightSettings.color || this.defaultSettings.color;
            }
            
            // 等待 DOM 加载完成
            if (document.readyState === 'loading') {
                console.log('Document still loading, waiting...');
                document.addEventListener('DOMContentLoaded', () => {
                    console.log('DOMContentLoaded fired');
                    this.initializeHighlighter();
                });
            } else {
                console.log('Document already loaded');
                this.initializeHighlighter();
            }
        }

        async initializeHighlighter() {
            if (this.initialized) return;
            
            try {
                console.log('Initializing highlighter...');
                
                // 获取当前收藏的单词
                const bookId = await this.getCurrentBookId();
                console.log('Current book ID:', bookId);
                
                if (!window.wordbookStorageModule) {
                    console.error('wordbookStorageModule not found');
                    return;
                }

                const words = await window.wordbookStorageModule.WordbookStorage.load(bookId);
                console.log('Loaded words:', words?.length || 0);
                
                if (!words || words.length === 0) return;

                // 如果单词数量超过限制，进行筛选
                if (words.length > this.MAX_HIGHLIGHT_WORDS) {
                    const filteredWords = this.filterWords(words);
                    words.length = 0;
                    words.push(...filteredWords);
                }

                // 将单词添加到集合中
                words.forEach(word => {
                    if (word && word.word) {
                        this.collectedWords.add({
                            word: word.word.toLowerCase(),
                            mean: Array.isArray(word.means) ? word.means.join('; ') : word.mean,
                            frequency: word.frequency || 0,
                            lastUsed: word.created_at || Date.now()
                        });
                    }
                });

                console.log('Collected words size:', this.collectedWords.size);

                if (this.collectedWords.size === 0) {
                    console.log('No valid words to highlight');
                    return;
                }

                // 初始化 popover
                this.initPopover();
                
                // 高亮单词
                this.highlightWords();
                
                // 监听 DOM 变化
                this.observeDOM();

                this.initialized = true;
                console.log('Highlighter initialization completed');
            } catch (error) {
                console.error('Failed to initialize highlighter:', error);
            }
        }

        async getCurrentBookId() {
            return await chrome.storage.local.get('bookId')
                .then(result => result.bookId || 0);
        }

        initPopover() {
            if (!document.body) return;

            const popover = document.createElement('div');
            popover.className = 'bcz-word-popover';
            popover.setAttribute('translate', 'no');
            popover.style.cssText = `
                position: fixed;
                display: none;
                background: white;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 6px 16px rgba(0,0,0,0.12);
                z-index: 999999;
                max-width: 380px;
                min-width: 300px;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                backdrop-filter: blur(8px);
                transform-origin: top left;
            `;
            document.body.appendChild(popover);
            this.popover = popover;
        }

        highlightWords() {
            if (!document.body || this.collectedWords.size === 0) return;

            // 移除旧的事件监听器
            document.removeEventListener('mouseover', this.handleMouseOver.bind(this));
            document.removeEventListener('mouseout', this.handleMouseOut.bind(this));

            // 使用 requestIdleCallback 在浏览器空闲时处理
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => {
                    this.processHighlighting();
                    // 添加新的事件监听器
                    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
                    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
                });
            } else {
                // 降级使用 requestAnimationFrame
                window.requestAnimationFrame(() => {
                    this.processHighlighting();
                    // 添加新的事件监听器
                    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
                    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
                });
            }
        }

        processHighlighting() {
            if (this.isProcessing) return;
            this.isProcessing = true;

            try {
                // 保存当前滚动位置
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // 创建一个包含所有单词的正则表达式
                const words = Array.from(this.collectedWords).map(info => info.word);
                const wordsRegex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
                
                // 获取可见区域的范围
                const viewportHeight = window.innerHeight;
                const visibleRange = {
                    top: window.scrollY - 100,
                    bottom: window.scrollY + viewportHeight + 100
                };

                requestAnimationFrame(() => {
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        {
                            acceptNode: (node) => {
                                const parent = node.parentElement;
                                if (!parent || this.processedNodes.has(node)) return NodeFilter.FILTER_REJECT;
                                
                                // 检查节点是否在可视区域内
                                const rect = parent.getBoundingClientRect();
                                const nodeTop = rect.top + window.scrollY;
                                if (nodeTop > visibleRange.bottom || nodeTop + rect.height < visibleRange.top) {
                                    return NodeFilter.FILTER_REJECT;
                                }

                                // 排除不需要处理的元素
                                if (parent.tagName === 'SCRIPT' || 
                                    parent.tagName === 'STYLE' || 
                                    parent.tagName === 'NOSCRIPT' ||
                                    parent.tagName === 'TEXTAREA' ||
                                    parent.tagName === 'INPUT' ||
                                    parent.tagName === 'PRE' ||
                                    parent.tagName === 'CODE' ||
                                    (parent.className && typeof parent.className === 'string' && 
                                     (parent.className.includes('bcz-') || parent.className.includes('highlight'))) ||
                                    // 检查是否在翻译弹窗内
                                    parent.closest('.bcz-word-popover')) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                
                                return /[a-zA-Z]/.test(node.textContent) ? 
                                       NodeFilter.FILTER_ACCEPT : 
                                       NodeFilter.FILTER_REJECT;
                            }
                        }
                    );

                    const textNodes = [];
                    let node;
                    let processedCount = 0;
                    const batchSize = 10;

                    while (node = walker.nextNode()) {
                        textNodes.push(node);
                        if (textNodes.length >= batchSize) {
                            this.processBatch(textNodes, wordsRegex);
                            textNodes.length = 0;
                            processedCount += batchSize;

                            if (processedCount >= 100) {
                                // 使用 setTimeout 来让出主线程
                                setTimeout(() => {
                                    this.isProcessing = false;
                                    this.processHighlighting();
                                }, 0);
                                return;
                            }
                        }
                    }

                    if (textNodes.length > 0) {
                        this.processBatch(textNodes, wordsRegex);
                    }

                    // 恢复滚动位置
                    window.scrollTo(0, scrollTop);
                    this.isProcessing = false;
                });
            } catch (error) {
                console.error('Error in processHighlighting:', error);
                this.isProcessing = false;
            }
        }

        processBatch(nodes, regex) {
            try {
                nodes.forEach(textNode => {
                    const text = textNode.textContent;
                    if (!regex.test(text)) {
                        this.processedNodes.add(textNode);
                        return;
                    }

                    regex.lastIndex = 0;
                    let modified = false;
                    const newText = text.replace(regex, match => {
                        modified = true;
                        const wordInfo = Array.from(this.collectedWords)
                            .find(info => info.word.toLowerCase() === match.toLowerCase());
                        
                        // 根据样式类型生成不同的样式
                        let style = '';
                        switch (this.highlightStyle) {
                            case 'background':
                                style = `background-color: ${this.highlightColor}33; border-radius: 3px; padding: 0 2px;`;
                                break;
                            case 'dotted':
                                style = `border-bottom: 2px dotted ${this.highlightColor};`;
                                break;
                            case 'wavy':
                                style = `text-decoration: wavy underline ${this.highlightColor};`;
                                break;
                            case 'dashed':
                                style = `border-bottom: 2px dashed ${this.highlightColor};`;
                                break;
                            case 'underline':
                            default:
                                style = `border-bottom: 2px solid ${this.highlightColor};`;
                        }
                        
                        return `<span class="bcz-highlighted-word" 
                                     data-word="${wordInfo.word}"
                                     data-mean="${wordInfo.mean}"
                                     style="${style} cursor: pointer;">${match}</span>`;
                    });

                    if (modified) {
                        const span = document.createElement('span');
                        span.innerHTML = newText;
                        textNode.parentNode.replaceChild(span, textNode);
                    }
                    this.processedNodes.add(textNode);
                });
            } catch (error) {
                console.error('Error in processBatch:', error);
                this.isProcessing = false;
            }
        }

        handleMouseOver(e) {
            const target = e.target;
            if (target.classList.contains('bcz-highlighted-word')) {
                // 清除任何正在进行的隐藏定时器
                if (this.hideTimeout) {
                    clearTimeout(this.hideTimeout);
                    this.hideTimeout = null;
                }

                const rect = target.getBoundingClientRect();
                
                // 格式化释义内容
                const meanings = target.dataset.mean.split(';').map(m => m.trim());
                const meaningsHtml = meanings.map((mean, index) => {
                    let partOfSpeech = '';
                    let definition = '';
                    
                    const match = mean.match(/^(\w+\.|【.*?】)?\s*(.+)$/);
                    if (match) {
                        partOfSpeech = match[1] || '';
                        definition = match[2] || mean;
                    } else {
                        definition = mean;
                    }
                    
                    return `
                        <div class="bcz-meaning-item" style="
                            margin-top: 8px;
                            padding: 6px 10px;
                            background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};
                            border-radius: 6px;
                        ">
                            <span style="
                                color: #1976D2;
                                font-weight: 500;
                                margin-right: 6px;
                                font-size: 12px;
                            ">${partOfSpeech}</span>
                            <span style="color: #424242;">${definition}</span>
                        </div>
                    `;
                }).join('');

                this.popover.innerHTML = `
                    <div style="margin-bottom: 12px;" translate="no">
                        <div style="
                            display: flex;
                            align-items: baseline;
                            gap: 8px;
                        ">
                            <span style="
                                font-size: 20px;
                                font-weight: 600;
                                color: #1976D2;
                            ">${target.dataset.word}</span>
                        </div>
                    </div>
                    
                    <div style="
                        max-height: 200px;
                        overflow-y: auto;
                        padding-right: 8px;
                        scrollbar-width: thin;
                        scrollbar-color: #90CAF9 #E3F2FD;
                    " translate="no">${meaningsHtml}</div>
                `;

                // 立即显示新内容
                this.popover.style.display = 'block';
                this.popover.style.opacity = '0';
                this.popover.style.transform = 'scale(0.95)';

                // 自定义滚动条样式
                const styleSheet = document.createElement('style');
                styleSheet.textContent = `
                    .bcz-word-popover div::-webkit-scrollbar {
                        width: 6px;
                    }
                    .bcz-word-popover div::-webkit-scrollbar-track {
                        background: #E3F2FD;
                        border-radius: 3px;
                    }
                    .bcz-word-popover div::-webkit-scrollbar-thumb {
                        background: #90CAF9;
                        border-radius: 3px;
                    }
                `;
                this.popover.appendChild(styleSheet);
                
                // 计算位置
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const popoverWidth = 380;
                const popoverHeight = this.popover.offsetHeight || 150;
                
                let left = rect.left;
                let top = rect.bottom + 12;
                
                if (left + popoverWidth > viewportWidth) {
                    left = viewportWidth - popoverWidth - 20;
                }
                
                if (top + popoverHeight > viewportHeight) {
                    top = rect.top - popoverHeight - 12;
                }
                
                left = Math.max(20, left);
                
                // 立即更新位置
                this.popover.style.left = `${left}px`;
                this.popover.style.top = `${top}px`;
                
                // 使用 requestAnimationFrame 确保平滑过渡
                requestAnimationFrame(() => {
                    this.popover.style.transition = 'opacity 0.15s ease-in-out, transform 0.15s ease-in-out';
                    this.popover.style.opacity = '1';
                    this.popover.style.transform = 'scale(1)';
                });
            }
        }

        handleMouseOut(e) {
            const target = e.target;
            if (target.classList.contains('bcz-highlighted-word')) {
                // 检查鼠标是否移动到了另一个高亮单词上
                const relatedTarget = e.relatedTarget;
                if (relatedTarget && relatedTarget.classList.contains('bcz-highlighted-word')) {
                    // 如果是移动到另一个高亮单词，不执行隐藏
                    return;
                }

                // 设置隐动画
                this.popover.style.opacity = '0';
                this.popover.style.transform = 'scale(0.95)';

                // 存储隐藏定时器
                this.hideTimeout = setTimeout(() => {
                    this.popover.style.display = 'none';
                    this.hideTimeout = null;
                }, 150); // 减少延迟时间
            }
        }

        observeDOM() {
            if (this.observer) {
                this.observer.disconnect();
            }

            let scrollTimeout;
            const debouncedHighlight = () => {
                if (this.highlightDebounceTimer) {
                    clearTimeout(this.highlightDebounceTimer);
                }
                
                // 确保不会在滚动过程中处理亮
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                
                this.highlightDebounceTimer = setTimeout(() => {
                    if (!this.isProcessing) {
                        this.highlightWords();
                    }
                }, 500);
            };

            // 优化滚动处理
            window.addEventListener('scroll', () => {
                if (scrollTimeout) {
                    clearTimeout(scrollTimeout);
                }
                
                scrollTimeout = setTimeout(() => {
                    if (!this.isProcessing) {
                        debouncedHighlight();
                    }
                }, 150);
            }, { passive: true });

            this.observer = new MutationObserver((mutations) => {
                let shouldHighlight = false;
                for (const mutation of mutations) {
                    // 只处理内容变化，忽略属性变化
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        shouldHighlight = true;
                        break;
                    }
                }
                if (shouldHighlight && !this.isProcessing) {
                    debouncedHighlight();
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: false,  // 不监听文本变化
                attributes: false      // 不监听属性变化
            });
        }

        // 添加移除高亮的方法
        removeHighlights() {
            try {
                // 移除事件监听器
                document.removeEventListener('mouseover', this.handleMouseOver.bind(this));
                document.removeEventListener('mouseout', this.handleMouseOut.bind(this));

                const highlights = document.querySelectorAll('.bcz-highlighted-word');
                highlights.forEach(el => {
                    const text = el.textContent;
                    el.parentNode.replaceChild(document.createTextNode(text), el);
                });
                
                if (this.popover) {
                    this.popover.remove();
                    this.popover = null;
                }
                
                this.initialized = false;
                this.processedNodes = new WeakSet();
            } finally {
                // 确保恢复原始的 overflow 样式
                if (this.originalOverflow !== null) {
                    document.body.style.overflow = this.originalOverflow;
                }
            }
        }

        filterWords(words) {
            // 计算单词分数
            const scoredWords = words.map(word => ({
                ...word,
                score: this.calculateWordScore(word)
            }));

            // 按分数排序并选择前 MAX_HIGHLIGHT_WORDS 个单词
            return scoredWords
                .sort((a, b) => b.score - a.score)
                .slice(0, this.MAX_HIGHLIGHT_WORDS);
        }

        calculateWordScore(word) {
            const now = Date.now();
            const daysSinceCollected = (now - word.created_at) / (1000 * 60 * 60 * 24);
            
            // 计算分数的因素：
            // 1. 单词长度（较短的单词优先）
            const lengthScore = Math.max(0, 10 - word.word.length) / 10;
            
            // 2. 收藏时间（最近收藏的优先）
            const timeScore = Math.max(0, 30 - daysSinceCollected) / 30;
            
            // 3. 单词复杂度（基于是否包含特殊字符、连字符等）
            const complexityScore = this.getWordComplexityScore(word.word);
            
            // 4. 使用频率（如果有的话）
            const frequencyScore = word.frequency ? word.frequency / 100 : 0;

            // 权重配置
            const weights = {
                length: 0.2,
                time: 0.3,
                complexity: 0.2,
                frequency: 0.3
            };

            // 计算最终分数
            return (lengthScore * weights.length) +
                   (timeScore * weights.time) +
                   (complexityScore * weights.complexity) +
                   (frequencyScore * weights.frequency);
        }

        getWordComplexityScore(word) {
            // 简单词汇的特征
            const hasHyphen = word.includes('-');
            const hasSpecialChars = /[^a-zA-Z-]/.test(word);
            const isAllLowerCase = word === word.toLowerCase();
            const isShort = word.length <= 6;

            let score = 1;
            if (hasHyphen) score -= 0.2;
            if (hasSpecialChars) score -= 0.3;
            if (!isAllLowerCase) score -= 0.1;
            if (!isShort) score -= 0.2;

            return Math.max(0, score);
        }

        // 添加调试方法
        _log(...args) {
            if (this.debug) {
                console.log('[ContentHighlighter]', ...args);
            }
        }
    }

    // 初始化高亮器
    const highlighter = new ContentHighlighter();
    highlighter.init().catch(console.error);

})(window, document); 