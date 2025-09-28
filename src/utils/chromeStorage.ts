import { PersistStorage, StorageValue } from 'zustand/middleware';

// Chrome存储适配器，用于zustand的persist中间件
export const chromeStorage: PersistStorage<any> = {
  getItem: async (name: string): Promise<StorageValue<any> | null> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([name]);
        const value = result[name];
        return value ? JSON.parse(value) : null;
      }
      // 降级到localStorage（用于开发环境）
      const value = localStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Chrome storage getItem error:', error);
      return null;
    }
  },
  
  setItem: async (name: string, value: StorageValue<any>): Promise<void> => {
    try {
      const serializedValue = JSON.stringify(value);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [name]: serializedValue });
      } else {
        // 降级到localStorage（用于开发环境）
        localStorage.setItem(name, serializedValue);
      }
    } catch (error) {
      console.error('Chrome storage setItem error:', error);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.remove([name]);
      } else {
        // 降级到localStorage（用于开发环境）
        localStorage.removeItem(name);
      }
    } catch (error) {
      console.error('Chrome storage removeItem error:', error);
    }
  }
};