import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginRequest, UserInfo } from '../api/types';
import { API } from '../api';
import { chromeStorage } from '../utils/chromeStorage';

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isLogin: boolean;
  login: (loginRequest: LoginRequest) => Promise<void>;
  logout: () => void;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes?.['auth-storage']?.newValue) {
    useAuthStore.persist.rehydrate();
  }
});

export const useAuthStore = create<AuthState>()(persist(
  (set) => ({
    user: null,
    token: null,
    isLogin: false,

    login: async (loginRequest: LoginRequest) => {
      try {
        const token = await API.login(loginRequest);        

        set({
          token,        
          isLogin: true
        })

        const userInfo = await API.getUserInfo();

        set({
          user: userInfo,
        });
      } catch (error) {
        console.error('登录失败:', error);
        throw error;
      }
    },

    logout: () => {
      set({
        user: null,
        token: null,
        isLogin: false
      });
    }
  }),
  {
    name: 'auth-storage',
    storage: chromeStorage,
    partialize: (state) => ({
      user: state.user,
      token: state.token,
      isLogin: state.isLogin,
    }),
  }
));