import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthSession } from '../types/auth';
import { isSessionExpired, createSession, refreshSession, verifyPassword, hashPassword } from '../utils/auth';

const AUTH_STORAGE_KEY = 'modular_analytics_auth_v2';
const LEGACY_AUTH_KEY = 'modular_analytics_auth';

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

let adminPasswordHash: string | null = null;

interface AuthStore {
  session: AuthSession | null;
  darkMode: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  checkAuth: () => boolean;
  refreshSessionIfActive: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      darkMode: false,

      login: async (username: string, password: string): Promise<boolean> => {
        if (username !== ADMIN_USERNAME) {
          return false;
        }

        if (import.meta.env.VITE_ADMIN_PASSWORD_HASH) {
          const isValid = await verifyPassword(password, import.meta.env.VITE_ADMIN_PASSWORD_HASH);
          if (!isValid) return false;
        } else {
          if (password !== ADMIN_PASSWORD) {
            return false;
          }
        }

        const session = createSession(username);
        set({ session });

        localStorage.removeItem(LEGACY_AUTH_KEY);

        return true;
      },

      logout: () => {
        set({ session: null });
        localStorage.removeItem(LEGACY_AUTH_KEY);
      },

      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },

      setDarkMode: (value: boolean) => {
        set({ darkMode: value });
      },

      checkAuth: (): boolean => {
        const { session } = get();

        if (!session) {
          const legacyAuth = localStorage.getItem(LEGACY_AUTH_KEY);
          if (legacyAuth === 'true') {
            const newSession = createSession(ADMIN_USERNAME);
            set({ session: newSession });
            localStorage.removeItem(LEGACY_AUTH_KEY);
            return true;
          }
          return false;
        }

        if (isSessionExpired(session)) {
          set({ session: null });
          return false;
        }

        return true;
      },

      refreshSessionIfActive: () => {
        const { session } = get();
        if (session && !isSessionExpired(session)) {
          const refreshed = refreshSession(session);
          set({ session: refreshed });
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        session: state.session,
        darkMode: state.darkMode,
      }),
    }
  )
);

export async function generatePasswordHash(password: string): Promise<string> {
  return hashPassword(password);
}
