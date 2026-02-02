import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useDarkMode() {
  const darkMode = useAuthStore((state) => state.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return darkMode;
}
