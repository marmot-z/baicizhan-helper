import { describe, expect, it } from 'vitest';
import {
  EMPTY_HISTORY_DATA,
  HISTORY_STORAGE_VERSION,
  MAX_HISTORY_ENTRIES,
  deleteHistoryData,
  historyStorage,
  normalizeHistoryText,
  parseHistoryStorageData,
  recordHistoryData,
  type HistoryStorageData,
} from './historyStorage';

describe('historyStorage', () => {
  it('normalizes English case and repeated whitespace', () => {
    expect(normalizeHistoryText('  Take   Off  ')).toBe('take off');
    expect(normalizeHistoryText('  中文  句子  ')).toBe('中文 句子');
  });

  it('merges the same content across search and selection sources', () => {
    const searched = recordHistoryData(EMPTY_HISTORY_DATA, {
      text: 'Apple',
      resultKind: 'word',
      source: 'search',
      preview: 'n. 苹果',
      topicId: 1,
    }, 100, 'apple-id');

    const selected = recordHistoryData(searched, {
      text: ' apple ',
      resultKind: 'word',
      source: 'selection',
      preview: '名词 苹果',
      topicId: 1,
      page: {
        title: 'Example page',
        url: 'https://example.com/article',
      },
    }, 200, 'unused-id');

    expect(selected.entries).toHaveLength(1);
    expect(selected.entries[0]).toMatchObject({
      id: 'apple-id',
      normalizedText: 'apple',
      sources: ['search', 'selection'],
      latestSource: 'selection',
      viewCount: 2,
      firstViewedAt: 100,
      lastViewedAt: 200,
      page: {
        title: 'Example page',
        url: 'https://example.com/article',
      },
    });
  });

  it('moves a repeated entry to the front', () => {
    let data = recordHistoryData(EMPTY_HISTORY_DATA, {
      text: 'first', resultKind: 'word', source: 'search', preview: 'first preview',
    }, 100, 'first-id');
    data = recordHistoryData(data, {
      text: 'second', resultKind: 'word', source: 'search', preview: 'second preview',
    }, 200, 'second-id');
    data = recordHistoryData(data, {
      text: 'FIRST', resultKind: 'word', source: 'search', preview: 'updated preview',
    }, 300, 'unused-id');

    expect(data.entries.map((entry) => entry.id)).toEqual(['first-id', 'second-id']);
    expect(data.entries[0].viewCount).toBe(2);
    expect(data.entries[0].preview).toBe('updated preview');
  });

  it('keeps only the newest 200 entries', () => {
    let data: HistoryStorageData = { version: HISTORY_STORAGE_VERSION, entries: [] };
    for (let index = 0; index <= MAX_HISTORY_ENTRIES; index += 1) {
      data = recordHistoryData(data, {
        text: `word-${index}`,
        resultKind: 'word',
        source: 'search',
        preview: `preview-${index}`,
      }, index, `id-${index}`);
    }

    expect(data.entries).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(data.entries[0].id).toBe(`id-${MAX_HISTORY_ENTRIES}`);
    expect(data.entries.at(-1)?.id).toBe('id-1');
  });

  it('truncates persisted text, preview, title and URL', () => {
    const data = recordHistoryData(EMPTY_HISTORY_DATA, {
      text: 'a'.repeat(400),
      resultKind: 'translation',
      source: 'selection',
      preview: 'b'.repeat(400),
      page: {
        title: 'c'.repeat(300),
        url: `https://example.com/${'d'.repeat(2200)}`,
      },
    }, 100, 'id');

    expect(data.entries[0].text).toHaveLength(300);
    expect(data.entries[0].preview).toHaveLength(300);
    expect(data.entries[0].page?.title).toHaveLength(200);
    expect(data.entries[0].page?.url).toHaveLength(2048);
  });

  it('deletes a single entry without changing the storage version', () => {
    const data = recordHistoryData(EMPTY_HISTORY_DATA, {
      text: 'apple', resultKind: 'word', source: 'search', preview: '苹果',
    }, 100, 'apple-id');

    expect(deleteHistoryData(data, 'apple-id')).toEqual(EMPTY_HISTORY_DATA);
  });

  it('falls back to empty history for corrupt or incompatible values', () => {
    expect(parseHistoryStorageData(null)).toEqual(EMPTY_HISTORY_DATA);
    expect(parseHistoryStorageData({ version: 2, entries: [] })).toEqual(EMPTY_HISTORY_DATA);
    expect(parseHistoryStorageData({ version: 1, entries: 'invalid' })).toEqual(EMPTY_HISTORY_DATA);

    const validEntry = recordHistoryData(EMPTY_HISTORY_DATA, {
      text: 'apple', resultKind: 'word', source: 'search', preview: '苹果', topicId: 1,
    }, 100, 'apple-id').entries[0];

    expect(parseHistoryStorageData({
      version: 1,
      entries: [validEntry, { ...validEntry, id: 'bad-source', sources: ['unknown'] }],
    })).toEqual(EMPTY_HISTORY_DATA);
    expect(parseHistoryStorageData({
      version: 1,
      entries: [{ ...validEntry, id: 'bad-time', lastViewedAt: Number.NaN }],
    })).toEqual(EMPTY_HISTORY_DATA);
    expect(parseHistoryStorageData({
      version: 1,
      entries: [{ ...validEntry, id: 'bad-page', page: { title: 123, url: null } }],
    })).toEqual(EMPTY_HISTORY_DATA);
  });

  it('serializes repository writes and supports delete and clear', async () => {
    const storageData: Record<string, unknown> = {};
    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {
        storage: {
          local: {
            get: async (key: string) => ({ [key]: storageData[key] }),
            set: async (values: Record<string, unknown>) => Object.assign(storageData, values),
            remove: async (key: string) => { delete storageData[key]; },
          },
        },
      },
    });

    await Promise.all([
      historyStorage.record({
        text: 'apple', resultKind: 'word', source: 'search', preview: '苹果',
      }),
      historyStorage.record({
        text: 'banana', resultKind: 'word', source: 'selection', preview: '香蕉',
      }),
    ]);

    const entries = await historyStorage.getAll();
    expect(entries).toHaveLength(2);
    expect(new Set(entries.map((entry) => entry.normalizedText))).toEqual(new Set(['apple', 'banana']));

    await historyStorage.delete(entries[0].id);
    expect(await historyStorage.getAll()).toHaveLength(1);

    await historyStorage.clear();
    expect(await historyStorage.getAll()).toEqual([]);
    Reflect.deleteProperty(globalThis, 'chrome');
  });
});
