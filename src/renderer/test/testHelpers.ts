import { beforeEach, afterEach, vi } from 'vitest';
import type { HistoryItem } from '@/types';

export function useLocalStorageCleanup(): void {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });
}

export function useThemeCleanup(): void {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });
}

export function useStorageAndThemeCleanup(): void {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });
}

export function setupWindowMocks(confirmReturnValue = true): {
  confirm: ReturnType<typeof vi.fn>;
  alert: ReturnType<typeof vi.fn>;
} {
  const confirm = vi.fn().mockReturnValue(confirmReturnValue);
  const alert = vi.fn();

  (window as unknown as { confirm: typeof vi.fn; alert: typeof vi.fn }).confirm = confirm;
  (window as unknown as { confirm: typeof vi.fn; alert: typeof vi.fn }).alert = alert;

  return { confirm, alert };
}

export function createHistoryItems(
  count: number,
  baseItem: Omit<HistoryItem, 'id' | 'fileName'> = {
    filePath: '/path/to/test.mp3',
    model: 'base',
    language: 'en',
    date: new Date().toISOString(),
    duration: 60,
    preview: 'Test preview',
    fullText: 'Test full text',
  }
): HistoryItem[] {
  return Array.from({ length: count }, (_, i) => ({
    ...baseItem,
    id: crypto.randomUUID(),
    fileName: `file${i}.mp3`,
  }));
}

export function parseStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function itemExistsInStorage(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

export function getStorageString(key: string, defaultValue = ''): string {
  return localStorage.getItem(key) || defaultValue;
}

export function getFromStorage<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
}
