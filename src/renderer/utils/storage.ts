import { logger } from '../services';

const STORAGE_KEYS = {
  HISTORY: 'whisperdesk_history',
  THEME: 'whisperdesk_theme',
  LAST_MODEL: 'whisperdesk_lastModel',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function getStorageItem<T>(key: StorageKey, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved) as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: StorageKey, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    logger.error(`Failed to save to localStorage [${key}]:`, e);
    return false;
  }
}

export function getStorageString(key: StorageKey, defaultValue: string): string {
  try {
    const saved = localStorage.getItem(key);
    return saved ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorageString(key: StorageKey, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    logger.error(`Failed to save to localStorage [${key}]:`, e);
    return false;
  }
}

export function removeStorageItem(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

export { STORAGE_KEYS };
