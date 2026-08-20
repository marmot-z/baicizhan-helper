import type { HighlightWord } from '../../api/types';

const HIGHLIGHT_ATTRIBUTE = 'data-bcz-helper-highlighted-word';
const HIGHLIGHT_SELECTOR = `[${HIGHLIGHT_ATTRIBUTE}]`;
const HIGHLIGHT_CLASS = 'bcz-helper-highlighted-word';
const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const SLICE_BUDGET_MS = 8;
const ENGLISH_TOKEN_SOURCE = String.raw`[A-Za-z]+(?:['’][A-Za-z]+)*(?:-[A-Za-z]+(?:['’][A-Za-z]+)*)*`;
const ENGLISH_TOKEN_PATTERN = new RegExp(ENGLISH_TOKEN_SOURCE, 'g');
const COMPLETE_ENGLISH_TOKEN_PATTERN = new RegExp(`^${ENGLISH_TOKEN_SOURCE}$`);
const SKIP_SELECTOR = [
  'script',
  'style',
  'noscript',
  'textarea',
  'input',
  'select',
  'option',
  'button',
  'pre',
  'code',
  '[contenteditable]:not([contenteditable="false"])',
  HIGHLIGHT_SELECTOR,
  '#wxt-app',
  '.bcz-helper-popover-content',
  '.bcz-helper-highlight-tooltip',
  '#baicizhan-helper-extension-injection',
].join(',');

interface IdleDeadlineLike {
  didTimeout: boolean;
  timeRemaining: () => number;
}

interface IdleWindow extends Window {
  requestIdleCallback?: (
    callback: (deadline: IdleDeadlineLike) => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
}

export interface HighlightHoverInfo {
  word: string;
  mean: string;
  rect: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
}

interface HighlightMatch {
  start: number;
  end: number;
  text: string;
  word: HighlightWord;
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/’/g, "'");
}

export function createHighlightWordMap(words: HighlightWord[]): Map<string, HighlightWord> {
  const wordMap = new Map<string, HighlightWord>();

  words.forEach((word) => {
    const normalizedWord = normalizeWord(word.word);
    if (!normalizedWord || !COMPLETE_ENGLISH_TOKEN_PATTERN.test(normalizedWord)) return;
    wordMap.set(normalizedWord, word);
  });

  return wordMap;
}

export function findHighlightMatches(
  text: string,
  wordMap: ReadonlyMap<string, HighlightWord>,
): HighlightMatch[] {
  const matches: HighlightMatch[] = [];
  ENGLISH_TOKEN_PATTERN.lastIndex = 0;

  let match = ENGLISH_TOKEN_PATTERN.exec(text);
  while (match) {
    const word = wordMap.get(normalizeWord(match[0]));
    if (word) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        word,
      });
    }
    match = ENGLISH_TOKEN_PATTERN.exec(text);
  }

  return matches;
}

export class PageHighlighter {
  private readonly wordMap: Map<string, HighlightWord>;
  private readonly onHoverChange: (info: HighlightHoverInfo | null) => void;
  private readonly processedNodes = new WeakSet<Text>();
  private readonly generatedNodes = new WeakSet<Node>();
  private readonly highlightData = new WeakMap<Element, HighlightWord>();
  private readonly directTextQueue: Text[] = [];
  private readonly walkerQueue: TreeWalker[] = [];
  private observer: MutationObserver | null = null;
  private scheduledHandle: number | null = null;
  private scheduledWithIdleCallback = false;
  private active = false;

  constructor(
    words: HighlightWord[],
    onHoverChange: (info: HighlightHoverInfo | null) => void,
  ) {
    this.wordMap = createHighlightWordMap(words);
    this.onHoverChange = onHoverChange;
  }

  start(): void {
    if (this.active || this.wordMap.size === 0 || !document.body) return;

    this.active = true;
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!this.generatedNodes.has(node)) {
            this.enqueueRoot(node);
          }
        });
      });
      this.scheduleProcessing();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });

    this.enqueueRoot(document.body);
    this.scheduleProcessing();
  }

  stop(): void {
    if (!this.active) return;

    this.active = false;
    this.observer?.disconnect();
    this.observer = null;
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('mouseout', this.handleMouseOut);
    this.cancelScheduledProcessing();
    this.directTextQueue.length = 0;
    this.walkerQueue.length = 0;
    this.onHoverChange(null);
    this.removeHighlights();
  }

  private enqueueRoot(node: Node): void {
    if (!this.active || this.generatedNodes.has(node)) return;

    if (node.nodeType === Node.TEXT_NODE) {
      this.directTextQueue.push(node as Text);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return;
    }

    if (node instanceof Element && this.shouldSkipElement(node)) return;

    // 不在 TreeWalker 过滤器中批量跳过节点，确保每个文本节点都受单次 8ms 分片预算控制。
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    this.walkerQueue.push(walker);
  }

  private scheduleProcessing(): void {
    if (!this.active || this.scheduledHandle !== null || !this.hasPendingWork()) return;

    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      this.scheduledWithIdleCallback = true;
      this.scheduledHandle = idleWindow.requestIdleCallback((deadline) => {
        this.scheduledHandle = null;
        this.processSlice(deadline);
      }, { timeout: 250 });
      return;
    }

    this.scheduledWithIdleCallback = false;
    this.scheduledHandle = window.setTimeout(() => {
      this.scheduledHandle = null;
      this.processSlice();
    }, 0);
  }

  private cancelScheduledProcessing(): void {
    if (this.scheduledHandle === null) return;

    const idleWindow = window as IdleWindow;
    if (this.scheduledWithIdleCallback && idleWindow.cancelIdleCallback) {
      idleWindow.cancelIdleCallback(this.scheduledHandle);
    } else {
      window.clearTimeout(this.scheduledHandle);
    }
    this.scheduledHandle = null;
  }

  private processSlice(deadline?: IdleDeadlineLike): void {
    if (!this.active) return;

    const startedAt = performance.now();
    let processedAtLeastOneNode = false;

    while (this.hasPendingWork()) {
      const withinTimeBudget = performance.now() - startedAt < SLICE_BUDGET_MS;
      const hasIdleTime = !deadline || deadline.didTimeout || deadline.timeRemaining() > 1;
      if (processedAtLeastOneNode && (!withinTimeBudget || !hasIdleTime)) break;

      const textNode = this.nextTextNode();
      if (textNode) {
        this.processTextNode(textNode);
        processedAtLeastOneNode = true;
      }
    }

    this.scheduleProcessing();
  }

  private hasPendingWork(): boolean {
    return this.directTextQueue.length > 0 || this.walkerQueue.length > 0;
  }

  private nextTextNode(): Text | null {
    const directTextNode = this.directTextQueue.shift();
    if (directTextNode) return directTextNode;

    while (this.walkerQueue.length > 0) {
      const node = this.walkerQueue[0].nextNode();
      if (node) return node as Text;
      this.walkerQueue.shift();
    }

    return null;
  }

  private shouldProcessTextNode(textNode: Text): boolean {
    if (this.processedNodes.has(textNode) || this.generatedNodes.has(textNode)) return false;
    if (!textNode.isConnected || !/[A-Za-z]/.test(textNode.data)) return false;

    const parent = textNode.parentElement;
    if (!parent || parent.namespaceURI !== HTML_NAMESPACE) return false;
    return !this.shouldSkipElement(parent);
  }

  private shouldSkipElement(element: Element): boolean {
    return element.matches(SKIP_SELECTOR) || element.closest(SKIP_SELECTOR) !== null;
  }

  private processTextNode(textNode: Text): void {
    if (!this.shouldProcessTextNode(textNode)) return;
    this.processedNodes.add(textNode);

    const matches = findHighlightMatches(textNode.data, this.wordMap);
    if (matches.length === 0 || !textNode.parentNode) return;

    const ownerDocument = textNode.ownerDocument;
    const fragment = ownerDocument.createDocumentFragment();
    let cursor = 0;

    matches.forEach((match) => {
      if (match.start > cursor) {
        fragment.appendChild(this.createGeneratedTextNode(ownerDocument, textNode.data.slice(cursor, match.start)));
      }

      const highlight = ownerDocument.createElement('span');
      highlight.className = HIGHLIGHT_CLASS;
      highlight.setAttribute(HIGHLIGHT_ATTRIBUTE, '');
      highlight.textContent = match.text;
      this.generatedNodes.add(highlight);
      this.highlightData.set(highlight, match.word);
      fragment.appendChild(highlight);
      cursor = match.end;
    });

    if (cursor < textNode.data.length) {
      fragment.appendChild(this.createGeneratedTextNode(ownerDocument, textNode.data.slice(cursor)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  private createGeneratedTextNode(ownerDocument: Document, text: string): Text {
    const textNode = ownerDocument.createTextNode(text);
    this.generatedNodes.add(textNode);
    return textNode;
  }

  private removeHighlights(): void {
    const parents = new Set<Node>();
    document.querySelectorAll<HTMLElement>(HIGHLIGHT_SELECTOR).forEach((highlight) => {
      const parent = highlight.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
      parents.add(parent);
    });
    parents.forEach((parent) => parent.normalize());
  }

  private readonly handleMouseOver = (event: MouseEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest(HIGHLIGHT_SELECTOR)
      : null;
    if (!target) return;

    const word = this.highlightData.get(target);
    if (!word) return;

    const rect = target.getBoundingClientRect();
    this.onHoverChange({
      word: word.word,
      mean: word.mean,
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      },
    });
  };

  private readonly handleMouseOut = (event: MouseEvent): void => {
    const target = event.target instanceof Element
      ? event.target.closest(HIGHLIGHT_SELECTOR)
      : null;
    if (!target) return;

    const relatedTarget = event.relatedTarget;
    if (relatedTarget instanceof Node && target.contains(relatedTarget)) return;
    this.onHoverChange(null);
  };
}
