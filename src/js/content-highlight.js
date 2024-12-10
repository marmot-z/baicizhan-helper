;(function(window, document) {
    'use strict';

    class ContentHighlighter {
        constructor() {
            this.collectedWords = new Map();
            this.popover = null;
            this.initialized = false;
            this.observer = null;
            this.highlightDebounceTimer = null;
            this.processedNodes = new WeakSet();
            this.isProcessing = false;
            this.originalOverflow = null;
            this.debug = true;
            this.highlightStyle = 'underline';
            this.highlightColor = '#2196F3';
            
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
                
                const bookId = await this.getCurrentBookId();
                console.log('Current book ID:', bookId);
                
                if (!window.wordbookStorageModule) {
                    console.error('wordbookStorageModule not found');
                    return;
                }

                const words = await window.wordbookStorageModule.WordbookStorage.load(bookId);
                console.log('Loaded words:', words?.length || 0);
                
                if (!words || words.length === 0) return;

                // 使用 Map 存储单词信息，提高查找效率
                words.forEach(word => {
                    if (word && word.word) {
                        this.collectedWords.set(word.word.toLowerCase(), {
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

            // 用 requestIdleCallback 在浏览器空闲时处理
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
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // 创建正则表达式时对单词进行排序，优先处理较长的单词
                const words = Array.from(this.collectedWords.keys())
                    .sort((a, b) => b.length - a.length);
                const wordsRegex = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
                
                // 获取可见区域的范围
                const viewportHeight = window.innerHeight;
                const visibleRange = {
                    top: window.scrollY,
                    center: window.scrollY + (viewportHeight / 2),
                    bottom: window.scrollY + viewportHeight
                };

                // 使用 IntersectionObserver API 来优化可见性检测
                this.setupIntersectionObserver();

                // 使用较低优先级处理可视区域外的内容
                requestIdleCallback(() => {
                    this.processContentByPriority(wordsRegex, visibleRange, scrollTop);
                }, { timeout: 1000 });
            } catch (error) {
                console.error('Error in processHighlighting:', error);
                this.isProcessing = false;
            }
        }

        // 新增方法：设置 IntersectionObserver
        setupIntersectionObserver() {
            if (this.intersectionObserver) {
                this.intersectionObserver.disconnect();
            }

            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        if (!element.hasAttribute('data-highlighted')) {
                            element.setAttribute('data-highlighted', 'true');
                            this.highlightElement(element);
                        }
                    }
                });
            }, {
                root: null,
                rootMargin: '100px 0px',
                threshold: 0.1
            });
        }

        // 新增方法：按优先级处理内容
        processContentByPriority(wordsRegex, visibleRange, scrollTop) {
            // 将页面分为三个优先级区域：可见区域、缓冲区、其他区域
            const bufferSize = 500;
            const zones = [
                { // 高优先级：可见区域
                    range: {
                        top: visibleRange.top,
                        bottom: visibleRange.bottom
                    },
                    delay: 0
                },
                { // 中优先级：缓冲区
                    range: {
                        top: visibleRange.top - bufferSize,
                        bottom: visibleRange.bottom + bufferSize
                    },
                    delay: 100
                },
                { // 低优先级：其他区域
                    range: {
                        top: 0,
                        bottom: document.documentElement.scrollHeight
                    },
                    delay: 500
                }
            ];

            // 按优先级处理各个区域
            zones.forEach((zone, index) => {
                setTimeout(() => {
                    const nodes = this.getNodesInRange(zone.range);
                    this.processNodesInChunks(nodes, wordsRegex, 10);
                }, zone.delay);
            });
        }

        // 新增方法：获取指定范围内的节点
        getNodesInRange(range) {
            const nodes = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        const parent = node.parentElement;
                        if (!parent || this.processedNodes.has(node)) return NodeFilter.FILTER_REJECT;
                        
                        const rect = parent.getBoundingClientRect();
                        const nodeTop = rect.top + window.scrollY;
                        
                        if (nodeTop < range.top || nodeTop > range.bottom) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        if (this.shouldSkipNode(parent)) {
                            return NodeFilter.FILTER_REJECT;
                        }

                        return /[a-zA-Z]/.test(node.textContent) ? 
                               NodeFilter.FILTER_ACCEPT : 
                               NodeFilter.FILTER_REJECT;
                    }
                }
            );

            let node;
            while (node = walker.nextNode()) {
                nodes.push(node);
            }
            return nodes;
        }

        // 新增方法：分块处理节点
        processNodesInChunks(nodes, wordsRegex, chunkSize) {
            let index = 0;
            
            const processChunk = () => {
                const chunk = nodes.slice(index, index + chunkSize);
                if (chunk.length === 0) {
                    this.isProcessing = false;
                    return;
                }

                requestIdleCallback(() => {
                    this.processBatch(chunk, wordsRegex);
                    index += chunkSize;
                    processChunk();
                }, { timeout: 100 });
            };

            processChunk();
        }

        shouldSkipNode(parent) {
            const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'PRE', 'CODE'];
            return skipTags.includes(parent.tagName) ||
                   (parent.className && typeof parent.className === 'string' && 
                    (parent.className.includes('bcz-') || parent.className.includes('highlight'))) ||
                   parent.closest('.bcz-word-popover');
        }

        processBatch(nodes, regex) {
            try {
                nodes.forEach(textNode => {
                    // 检查节点是否仍然在文档中
                    if (!textNode.isConnected || !textNode.parentNode) {
                        this.processedNodes.add(textNode);
                        return;
                    }

                    const text = textNode.textContent;
                    if (!regex.test(text)) {
                        this.processedNodes.add(textNode);
                        return;
                    }

                    regex.lastIndex = 0;
                    let modified = false;
                    const newText = text.replace(regex, match => {
                        modified = true;
                        // 从 Map 中获取单词信息
                        const wordInfo = this.collectedWords.get(match.toLowerCase());
                        if (!wordInfo) {
                            return match; // 如果找不到单词信息，保持原样
                        }
                        
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
                        try {
                            // 再次检查父节点是否存在
                            if (textNode.parentNode) {
                                const span = document.createElement('span');
                                span.innerHTML = newText;
                                textNode.parentNode.replaceChild(span, textNode);
                            }
                        } catch (e) {
                            console.warn('Failed to replace text node:', e);
                        }
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
                
                this.highlightDebounceTimer = setTimeout(() => {
                    if (!this.isProcessing) {
                        this.processHighlighting();
                    }
                }, 150); // 降低滚动时的处理频率
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
                }, 100);
            }, { passive: true });

            // 使用 MutationObserver 监听 DOM 变化
            this.observer = new MutationObserver((mutations) => {
                let shouldHighlight = false;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length) {
                        shouldHighlight = true;
                        break;
                    }
                }
                if (shouldHighlight && !this.isProcessing) {
                    requestIdleCallback(() => debouncedHighlight(), { timeout: 1000 });
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: false,
                attributes: false
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