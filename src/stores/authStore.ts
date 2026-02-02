import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUTH_KEY = 'modular_analytics_auth';

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

interface AuthStore {
  authenticated: boolean;
  darkMode: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      authenticated: localStorage.getItem(AUTH_KEY) === 'true',
      darkMode: false, 

      login: (username, password) => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
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
        set((state) => ({ darkMode: !state.darkMode }));
      },

      setDarkMode: (value) => {
        set({ darkMode: value });
      },

      checkAuth: () => {
        return localStorage.getItem(AUTH_KEY) === 'true';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
);
