import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chromeStorage } from '../utils/chromeStorage';

interface SettingsState {
  defaultWordBook: {bookId: number, bookName: string};
  autoPlay: boolean;
  autoPlayAccent: 'uk' | 'usa';
  translateTiming: number;
  theme: 'light' | 'dark';
  collectShortcut: string;
  pageHighlightEnabled: boolean;
  setDefaultWordBook: (book: {bookId: number, bookName: string}) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setAutoPlayAccent: (accent: 'uk' | 'usa') => void;
  setTranslateTiming: (timing: number) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCollectShortcut: (shortcut: string) => void;
  setPageHighlightEnabled: (enabled: boolean) => void;
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
    autoPlayAccent: 'uk',
    translateTiming: 0,
    theme: 'light',
    collectShortcut: '',
    pageHighlightEnabled: false,
    
    setDefaultWordBook: (book: {bookId: number, bookName: string}) => set({ defaultWordBook: book }),
    
    setAutoPlay: (autoPlay: boolean) => set({ autoPlay }),

    setAutoPlayAccent: (autoPlayAccent: 'uk' | 'usa') => set({ autoPlayAccent }),
    
    setTranslateTiming: (timing: number) => set({ translateTiming: timing }),
    
    setTheme: (theme: 'light' | 'dark') => set({ theme }),
    
    setCollectShortcut: (shortcut: string) => set({ collectShortcut: shortcut }),

    setPageHighlightEnabled: (pageHighlightEnabled: boolean) => set({ pageHighlightEnabled }),
  }),
  {
    name: 'setting-storage',
    storage: chromeStorage,
    partialize: (state) => ({
      defaultWordBook: state.defaultWordBook,
      autoPlay: state.autoPlay,
      autoPlayAccent: state.autoPlayAccent,
      translateTiming: state.translateTiming,
      theme: state.theme,
      collectShortcut: state.collectShortcut,
      pageHighlightEnabled: state.pageHighlightEnabled,
    })
  }
));
