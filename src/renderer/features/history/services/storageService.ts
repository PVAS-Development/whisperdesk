import type { HistoryItem } from '../../../types';
import {
  STORAGE_KEYS,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '../../../utils/storage';
import { APP_CONFIG } from '../../../config/constants';

export function loadHistory(): HistoryItem[] {
  return getStorageItem<HistoryItem[]>(STORAGE_KEYS.HISTORY, []);
}

export function saveHistory(history: HistoryItem[]): boolean {
  const trimmed = history.slice(0, APP_CONFIG.MAX_HISTORY_ITEMS);
  return setStorageItem(STORAGE_KEYS.HISTORY, trimmed);
}

export function addHistoryItem(
  history: HistoryItem[],
  item: Omit<HistoryItem, 'id'>
): HistoryItem[] {
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
  };
  const newHistory = [newItem, ...history];
  saveHistory(newHistory);
  return newHistory;
}

export function removeHistoryItem(history: HistoryItem[], itemId: string): HistoryItem[] {
  const newHistory = history.filter((item) => item.id !== itemId);
  saveHistory(newHistory);
  return newHistory;
}

export function clearHistory(): void {
  removeStorageItem(STORAGE_KEYS.HISTORY);
}

export function createHistoryItem(
  fileName: string,
  filePath: string,
  model: string,
  language: string,
  duration: number,
  fullText: string
): Omit<HistoryItem, 'id'> {
  return {
    fileName,
    filePath,
    model: model as HistoryItem['model'],
    language: language as HistoryItem['language'],
    date: new Date().toISOString(),
    duration,
    preview: fullText.substring(0, 100) + (fullText.length > 100 ? '...' : ''),
    fullText,
  };
}
