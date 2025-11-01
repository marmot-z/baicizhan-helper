import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API } from '../api';
import { chromeStorage } from '../utils/chromeStorage';

interface WordBookData {
  wordsMap: Record<number, number[]>;
  timestamp: number;
}

interface WordBookStore {
  data: WordBookData | null;

  // 初始化数据
  initialize: () => Promise<void>;

  // 获取所有单词本中的单词ID列表
  getAllWordIds: () => Promise<number[]>;

  // 清除缓存
  clearCache: () => void;

  appendTopicId: (bookId: number, topicId: number) => boolean;

  deleteTopicId: (bookId: number, topicId: number) => boolean;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes?.['wordbook-storage']?.newValue) {
    useWordBookStorage.persist.rehydrate();
  }
});

const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12小时

export const useWordBookStorage = create<WordBookStore>()(persist(
  (set, get) => ({
    data: null,

    initialize: async () => {
      const { data } = get();

      // 如果有有效缓存，直接返回
      if (data && Date.now() - data.timestamp < CACHE_DURATION) {
        return;
      }

      try {
        // 1. 获取用户单词本列表
        const books = await API.getBooks();

        // 2. 获取每个单词本的单词列表
        const wordsMap: Record<number, number[]> = {};

        await Promise.all(
          books.map(async (book) => {
            try {
              const words = await API.getBookWords(book.user_book_id);
              wordsMap[book.user_book_id] = words.map(word => word.topic_id);
            } catch (error) {
              console.error(`Failed to load words for book ${book.user_book_id}:`, error);
              wordsMap[book.user_book_id] = [];
            }
          })
        );

        const newData: WordBookData = {
          wordsMap,
          timestamp: Date.now()
        };

        set({ data: newData });
      } catch (error) {
        console.error('Failed to initialize word book storage:', error);
      }
    },

    getAllWordIds: async () => {
      const { data, initialize, clearCache } = get();

      // 如果没有数据，初始化数据
      if (!data) {
        await initialize();
        return get().getAllWordIds();
      }

      // 检查时效性（12小时 = 12 * 60 * 60 * 1000 毫秒）
      const now = Date.now();
      const cacheExpiry = 12 * 60 * 60 * 1000;
      if (now - data.timestamp > cacheExpiry) {
        clearCache();
        await initialize();
        return get().getAllWordIds();
      }

      // 返回所有单词ID，使用Set去重
      const allWordIds = new Set<number>();
      Object.values(data.wordsMap).forEach((words) => {
        words.forEach((word) => allWordIds.add(word));
      });

      return Array.from(allWordIds);
    },

    clearCache: () => {
      set({ data: null });
    },

    appendTopicId(bookId, topicId) {
      const { data } = get();
      if (!data) return false;

      const words = data.wordsMap[bookId];
      if (!words || words.includes(topicId)) return false;

      words.push(topicId);
      set({ data: { ...data } });
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
      
      set({ data: { ...data } }); 

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