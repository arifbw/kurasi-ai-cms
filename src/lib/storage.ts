import { AppState } from '../types';

const STORAGE_KEY = 'modular_analytics_system';
const AUTH_KEY = 'modular_analytics_auth';

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return { sectors: [], clients: [], masterModules: [] };
    }
    return JSON.parse(serialized);
  } catch (err) {
    console.error('Failed to load state:', err);
    return { sectors: [], clients: [], masterModules: [] };
  }
};

export const saveState = (state: AppState): void => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save state:', err);
  }
};

export const isAuthenticated = (): boolean => {
  return localStorage.getItem(AUTH_KEY) === 'true';
};

export const login = (username: string, password: string): boolean => {
  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
};

export const logout = (): void => {
  localStorage.removeItem(AUTH_KEY);
};