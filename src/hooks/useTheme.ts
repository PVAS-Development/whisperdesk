import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS, getStorageString, setStorageString } from '../utils/storage';

export type Theme = 'light' | 'dark';

const DEFAULT_THEME: Theme = 'light';

function loadTheme(): Theme {
  const saved = getStorageString(STORAGE_KEYS.THEME, DEFAULT_THEME);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  return DEFAULT_THEME;
}

export interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>(loadTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStorageString(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = useCallback((): void => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((newTheme: Theme): void => {
    setThemeState(newTheme);
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark',
  };
}
