import type { MeanInfo } from '../api/types';

export const HISTORY_STORAGE_KEY = 'history-storage-v1';
export const HISTORY_STORAGE_VERSION = 1 as const;
export const MAX_HISTORY_ENTRIES = 200;

const MAX_TEXT_LENGTH = 300;
const MAX_PREVIEW_LENGTH = 300;
const MAX_PAGE_TITLE_LENGTH = 200;
const MAX_PAGE_URL_LENGTH = 2048;

export type HistorySource = 'search' | 'selection';
export type HistoryResultKind = 'word' | 'translation';

export interface HistoryPageContext {
  title: string;
  url: string;
}

export interface HistoryEntry {
  id: string;
  text: string;
  normalizedText: string;
  resultKind: HistoryResultKind;
  sources: HistorySource[];
  latestSource: HistorySource;
  preview: string;
  topicId?: number;
  page?: HistoryPageContext;
  firstViewedAt: number;
  lastViewedAt: number;
  viewCount: number;
}

export interface HistoryStorageData {
  version: typeof HISTORY_STORAGE_VERSION;
  entries: HistoryEntry[];
}

export interface HistoryRecordInput {
  text: string;
  resultKind: HistoryResultKind;
  source: HistorySource;
  preview: string;
  topicId?: number;
  page?: HistoryPageContext;
}

export const EMPTY_HISTORY_DATA: HistoryStorageData = {
  version: HISTORY_STORAGE_VERSION,
  entries: [],
};

function truncate(value: string, length: number): string {
  return value.trim().slice(0, length);
}

export function normalizeHistoryText(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return /[A-Za-z]/.test(normalized) ? normalized.toLocaleLowerCase() : normalized;
}

export function buildWordHistoryPreview(means: Pick<MeanInfo, 'mean_type' | 'mean'>[]): string {
  const preview = means
    .filter((item) => item.mean)
    .slice(0, 3)
    .map((item) => `${item.mean_type || '其他'} ${item.mean}`)
    .join('; ');

  return truncate(preview, MAX_PREVIEW_LENGTH);
}

function createId(now: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${now}-${Math.random().toString(36).slice(2)}`;
}

function sanitizePage(page?: HistoryPageContext): HistoryPageContext | undefined {
  if (!page) return undefined;

  const title = truncate(page.title || '', MAX_PAGE_TITLE_LENGTH);
  const url = truncate(page.url || '', MAX_PAGE_URL_LENGTH);
  if (!title && !url) return undefined;

  return { title, url };
}

function isValidPageContext(value: unknown): value is HistoryPageContext {
  if (!value || typeof value !== 'object') return false;
  const page = value as Partial<HistoryPageContext>;
  return typeof page.title === 'string'
    && page.title.length <= MAX_PAGE_TITLE_LENGTH
    && typeof page.url === 'string'
    && page.url.length <= MAX_PAGE_URL_LENGTH;
}

function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;

  const item = value as Partial<HistoryEntry>;
  const sources = item.sources;
  const sourcesAreValid = Array.isArray(sources)
    && sources.length > 0
    && sources.every((source) => source === 'search' || source === 'selection')
    && new Set(sources).size === sources.length;

  return typeof item.id === 'string'
    && item.id.length > 0
    && typeof item.text === 'string'
    && item.text.length > 0
    && item.text.length <= MAX_TEXT_LENGTH
    && typeof item.normalizedText === 'string'
    && item.normalizedText === normalizeHistoryText(item.text)
    && (item.resultKind === 'word' || item.resultKind === 'translation')
    && sourcesAreValid
    && (item.latestSource === 'search' || item.latestSource === 'selection')
    && sources.includes(item.latestSource)
    && typeof item.preview === 'string'
    && item.preview.length <= MAX_PREVIEW_LENGTH
    && (item.topicId === undefined || (Number.isInteger(item.topicId) && item.topicId > 0))
    && (item.page === undefined || isValidPageContext(item.page))
    && typeof item.firstViewedAt === 'number'
    && Number.isFinite(item.firstViewedAt)
    && typeof item.lastViewedAt === 'number'
    && Number.isFinite(item.lastViewedAt)
    && item.lastViewedAt >= item.firstViewedAt
    && typeof item.viewCount === 'number'
    && Number.isInteger(item.viewCount)
    && item.viewCount > 0;
}

export function parseHistoryStorageData(value: unknown): HistoryStorageData {
  if (!value || typeof value !== 'object') return { ...EMPTY_HISTORY_DATA, entries: [] };

  const candidate = value as Partial<HistoryStorageData>;
  if (candidate.version !== HISTORY_STORAGE_VERSION || !Array.isArray(candidate.entries)) {
    return { ...EMPTY_HISTORY_DATA, entries: [] };
  }

  if (!candidate.entries.every(isValidHistoryEntry)) {
    return { ...EMPTY_HISTORY_DATA, entries: [] };
  }

  return {
    version: HISTORY_STORAGE_VERSION,
    entries: [...candidate.entries]
      .sort((left, right) => right.lastViewedAt - left.lastViewedAt)
      .slice(0, MAX_HISTORY_ENTRIES),
  };
}

export function recordHistoryData(
  data: HistoryStorageData,
  input: HistoryRecordInput,
  now = Date.now(),
  id = createId(now),
): HistoryStorageData {
  const text = truncate(input.text, MAX_TEXT_LENGTH);
  const normalizedText = normalizeHistoryText(text);
  if (!normalizedText) return data;

  const preview = truncate(input.preview, MAX_PREVIEW_LENGTH);
  const existing = data.entries.find((entry) => entry.normalizedText === normalizedText);
  const sources = existing
    ? Array.from(new Set([...existing.sources, input.source]))
    : [input.source];

  const nextEntry: HistoryEntry = {
    id: existing?.id ?? id,
    text,
    normalizedText,
    resultKind: input.resultKind,
    sources,
    latestSource: input.source,
    preview: preview || existing?.preview || '',
    topicId: input.topicId ?? existing?.topicId,
    page: sanitizePage(input.page) ?? existing?.page,
    firstViewedAt: existing?.firstViewedAt ?? now,
    lastViewedAt: now,
    viewCount: (existing?.viewCount ?? 0) + 1,
  };

  return {
    version: HISTORY_STORAGE_VERSION,
    entries: [
      nextEntry,
      ...data.entries.filter((entry) => entry.id !== nextEntry.id),
    ].slice(0, MAX_HISTORY_ENTRIES),
  };
}

export function deleteHistoryData(data: HistoryStorageData, id: string): HistoryStorageData {
  return {
    version: HISTORY_STORAGE_VERSION,
    entries: data.entries.filter((entry) => entry.id !== id),
  };
}

let writeQueue: Promise<void> = Promise.resolve();

function enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(operation, operation);
  writeQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function readHistoryData(): Promise<HistoryStorageData> {
  const result = await chrome.storage.local.get(HISTORY_STORAGE_KEY);
  return parseHistoryStorageData(result[HISTORY_STORAGE_KEY]);
}

export const historyStorage = {
  async getAll(): Promise<HistoryEntry[]> {
    await writeQueue;
    return (await readHistoryData()).entries;
  },

  record(input: HistoryRecordInput): Promise<HistoryEntry[]> {
    return enqueueWrite(async () => {
      const current = await readHistoryData();
      const next = recordHistoryData(current, input);
      await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: next });
      return next.entries;
    });
  },

  delete(id: string): Promise<HistoryEntry[]> {
    return enqueueWrite(async () => {
      const current = await readHistoryData();
      const next = deleteHistoryData(current, id);
      await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: next });
      return next.entries;
    });
  },

  clear(): Promise<void> {
    return enqueueWrite(async () => {
      await chrome.storage.local.remove(HISTORY_STORAGE_KEY);
    });
  },
};
