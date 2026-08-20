import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API } from '../api';
import type { HighlightWord, UserBookWordDetail } from '../api/types';
import { chromeStorage } from '../utils/chromeStorage';

interface WordBookData {
  wordsMap: Record<number, number[]>;
  highlightWords?: HighlightWord[];
  timestamp: number;
}

interface WordBookStore {
  data: WordBookData | null;

  // 初始化数据
  initialize: () => Promise<void>;

  // 获取所有单词本中的单词ID列表
  getAllWordIds: () => Promise<number[]>;

  // 获取所有单词本中用于网页高亮的单词
  getAllHighlightWords: () => Promise<HighlightWord[]>;

  // 清除缓存
  clearCache: () => void;

  // 仅使高亮词表失效，下一次页面加载时重新获取
  invalidateHighlightWords: () => void;

  appendTopicId: (bookId: number, topicId: number) => boolean;

  deleteTopicId: (bookId: number, topicId: number) => boolean;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes?.['wordbook-storage']?.newValue) {
    useWordBookStorage.persist.rehydrate();
  }
});

const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12小时
let initializePromise: Promise<void> | null = null;

function buildHighlightWords(wordsByBook: UserBookWordDetail[][]): HighlightWord[] {
  const latestWords = new Map<string, UserBookWordDetail>();

  wordsByBook.flat().forEach((word) => {
    const normalizedWord = word.word?.trim().toLowerCase();
    if (!normalizedWord) return;

    const current = latestWords.get(normalizedWord);
    if (!current || word.created_at > current.created_at) {
      latestWords.set(normalizedWord, word);
    }
  });

  return Array.from(latestWords.values()).map((word) => ({
    topicId: word.topic_id,
    word: word.word.trim(),
    mean: word.mean?.trim() || '',
  }));
}

export const useWordBookStorage = create<WordBookStore>()(persist(
  (set, get) => ({
    data: null,

    initialize: async () => {
      const { data } = get();

      // 如果有有效缓存，直接返回
      if (data && Date.now() - data.timestamp < CACHE_DURATION) {
        return;
      }

      if (!initializePromise) {
        initializePromise = (async () => {
          try {
            // 1. 获取用户单词本列表
            const books = await API.getBooks();

            // 2. 获取每个单词本的单词列表
            const wordsMap: Record<number, number[]> = {};
            const wordsByBook = await Promise.all(
              books.map(async (book) => {
                try {
                  const words = await API.getBookWords(book.user_book_id);
                  wordsMap[book.user_book_id] = words.map(word => word.topic_id);
                  return words;
                } catch (error) {
                  console.error(`Failed to load words for book ${book.user_book_id}:`, error);
                  wordsMap[book.user_book_id] = [];
                  return [];
                }
              })
            );

            const newData: WordBookData = {
              wordsMap,
              highlightWords: buildHighlightWords(wordsByBook),
              timestamp: Date.now()
            };

            set({ data: newData });
          } catch (error) {
            console.error('Failed to initialize word book storage:', error);
          }
        })().finally(() => {
          initializePromise = null;
        });
      }

      await initializePromise;
    },

    getAllWordIds: async () => {
      const { initialize, clearCache } = get();
      let { data } = get();

      // 如果没有数据，初始化数据
      if (!data) {
        await initialize();
        data = get().data;
      }

      if (!data) return [];

      // 检查时效性（12小时 = 12 * 60 * 60 * 1000 毫秒）
      const now = Date.now();
      const cacheExpiry = 12 * 60 * 60 * 1000;
      if (now - data.timestamp > cacheExpiry) {
        clearCache();
        await initialize();
        data = get().data;
      }

      if (!data) return [];

      // 返回所有单词ID，使用Set去重
      const allWordIds = new Set<number>();
      Object.values(data.wordsMap).forEach((words) => {
        words.forEach((word) => allWordIds.add(word));
      });

      return Array.from(allWordIds);
    },

    getAllHighlightWords: async () => {
      const { initialize, clearCache } = get();
      let { data } = get();

      if (!data || !Array.isArray(data.highlightWords)) {
        clearCache();
        await initialize();
        data = get().data;
      }

      if (!data) return [];

      if (Date.now() - data.timestamp > CACHE_DURATION) {
        clearCache();
        await initialize();
        data = get().data;
      }

      return data?.highlightWords || [];
    },

    clearCache: () => {
      set({ data: null });
    },

    invalidateHighlightWords: () => {
      const { data } = get();
      if (!data) return;

      set({
        data: {
          ...data,
          highlightWords: undefined,
        },
      });
    },

    appendTopicId(bookId, topicId) {
      const { data } = get();
      if (!data) return false;

      const words = data.wordsMap[bookId];
      if (!words) {
        set({ data: { ...data, highlightWords: undefined } });
        return false;
      }
      if (words.includes(topicId)) return false;

      words.push(topicId);
      set({ data: { ...data, highlightWords: undefined } });
      return true;
    },

    deleteTopicId(bookId, topicId) {
      const { data } = get();
      
      if (!data) return false;

      for (const words of Object.values(data.wordsMap)) {
        const index = words.findIndex(word => word === topicId);
        if (index !== -1) {
          words.splice(index, 1);
        }
      }
      
      set({ data: { ...data, highlightWords: undefined } });

      return true;
    },
  }),
  {
    name: 'wordbook-storage',
    storage: chromeStorage,
    partialize: (state) => ({
      data: state.data,
    }),
  }
));
