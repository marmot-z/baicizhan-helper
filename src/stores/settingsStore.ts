import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chromeStorage } from '../utils/chromeStorage';

interface SettingsState {
  defaultWordBook: {bookId: number, bookName: string};
  autoPlay: boolean;
  setDefaultWordBook: (book: {bookId: number, bookName: string}) => void;
  setAutoPlay: (autoPlay: boolean) => void;
}

export const settingsStore = create<SettingsState>()(persist(
  (set) => ({
    defaultWordBook: {bookId: 0, bookName: '收藏的单词'},
    autoPlay: false,
    
    setDefaultWordBook: (book: {bookId: number, bookName: string}) => set({ defaultWordBook: book }),
    
    setAutoPlay: (autoPlay: boolean) => set({ autoPlay }),
  }),
  {
    name: 'setting-storage',
    storage: chromeStorage,
    partialize: (state) => ({
      defaultWordBook: state.defaultWordBook,
      autoPlay: state.autoPlay,
    })
  }
));