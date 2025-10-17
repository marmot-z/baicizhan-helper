import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chromeStorage } from '../utils/chromeStorage';

interface SettingsState {
  defaultWordBook: {bookId: number, bookName: string};
  autoPlay: boolean;
  translateTiming: number;
  setDefaultWordBook: (book: {bookId: number, bookName: string}) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setTranslateTiming: (timing: number) => void;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes?.['setting-storage']?.newValue) {
    settingsStore.persist.rehydrate();
  }
});

export const settingsStore = create<SettingsState>()(persist(
  (set) => ({
    defaultWordBook: {bookId: 0, bookName: '收藏的单词'},
    autoPlay: false,
    translateTiming: 0,
    
    setDefaultWordBook: (book: {bookId: number, bookName: string}) => set({ defaultWordBook: book }),
    
    setAutoPlay: (autoPlay: boolean) => set({ autoPlay }),
    
    setTranslateTiming: (timing: number) => set({ translateTiming: timing }),
  }),
  {
    name: 'setting-storage',
    storage: chromeStorage,
    partialize: (state) => ({
      defaultWordBook: state.defaultWordBook,
      autoPlay: state.autoPlay,
      translateTiming: state.translateTiming,
    })
  }
));