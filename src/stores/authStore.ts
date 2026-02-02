import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUTH_KEY = 'modular_analytics_auth';
const DARK_MODE_KEY = 'darkMode';

interface AuthStore {
  authenticated: boolean;
  darkMode: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  toggleDarkMode: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      authenticated: localStorage.getItem(AUTH_KEY) === 'true',
      darkMode: localStorage.getItem(DARK_MODE_KEY) === 'true',

      login: (username, password) => {
        if (username === 'admin' && password === 'admin123') {
          localStorage.setItem(AUTH_KEY, 'true');
          set({ authenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        localStorage.removeItem(AUTH_KEY);
        set({ authenticated: false });
      },

      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;
          localStorage.setItem(DARK_MODE_KEY, newDarkMode.toString());
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newDarkMode };
        });
      },

      checkAuth: () => {
        return localStorage.getItem(AUTH_KEY) === 'true';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ darkMode: state.darkMode }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);
