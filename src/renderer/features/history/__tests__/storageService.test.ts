import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadHistory,
  saveHistory,
  addHistoryItem,
  removeHistoryItem,
  clearHistory,
  createHistoryItem,
} from '../services/storageService';
import type { HistoryItem } from '@/types';
import * as storage from '@/utils/storage';
import { APP_CONFIG } from '@/config';

vi.mock('@/utils/storage', () => ({
  STORAGE_KEYS: { HISTORY: 'whisperdesk_history' },
  getStorageItem: vi.fn().mockReturnValue([]),
  setStorageItem: vi.fn().mockReturnValue(true),
  removeStorageItem: vi.fn(),
}));

const baseItem: Omit<HistoryItem, 'id'> = {
  fileName: 'file.mp3',
  filePath: '/path/file.mp3',
  model: 'base',
  language: 'en',
  date: new Date().toISOString(),
  duration: 10,
  preview: 'preview',
  fullText: 'full text',
};

describe('history storageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadHistory uses storage with default empty array', () => {
    const result = loadHistory();
    expect(storage.getStorageItem).toHaveBeenCalledWith('whisperdesk_history', []);
    expect(result).toEqual([]);
  });

  it('saveHistory trims to MAX_HISTORY_ITEMS and persists', () => {
    const longHistory: HistoryItem[] = Array.from(
      { length: APP_CONFIG.MAX_HISTORY_ITEMS + 5 },
      (_, i) => ({
        ...baseItem,
        id: `item-${i}`,
        fileName: `file${i}.mp3`,
      })
    );

    const ok = saveHistory(longHistory);
    expect(ok).toBe(true);
    const trimmed = longHistory.slice(0, APP_CONFIG.MAX_HISTORY_ITEMS);
    expect(storage.setStorageItem).toHaveBeenCalledWith('whisperdesk_history', trimmed);
  });

  it('addHistoryItem adds a new item with generated id and saves', () => {
    const uuidSpy = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('12345678-1234-1234-1234-123456789012');
    const history: HistoryItem[] = [];

    const result = addHistoryItem(history, baseItem);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('12345678-1234-1234-1234-123456789012');
    expect(result[0]!.fileName).toBe(baseItem.fileName);
    expect(storage.setStorageItem).toHaveBeenCalled();

    uuidSpy.mockRestore();
  });

  it('removeHistoryItem filters out removed id and saves', () => {
    const history: HistoryItem[] = [
      { ...baseItem, id: 'item-1' },
      { ...baseItem, id: 'item-2', fileName: 'other.mp3' },
    ];

    const result = removeHistoryItem(history, 'item-1');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('item-2');
    expect(storage.setStorageItem).toHaveBeenCalled();
  });

  it('clearHistory removes storage key', () => {
    clearHistory();
    expect(storage.removeStorageItem).toHaveBeenCalledWith('whisperdesk_history');
  });

  it('createHistoryItem builds preview and preserves full text', () => {
    const text = 'a'.repeat(150);
    const item = createHistoryItem('name', '/path', 'base', 'en', 42, text);

    expect(item.fileName).toBe('name');
    expect(item.filePath).toBe('/path');
    expect(item.model).toBe('base');
    expect(item.language).toBe('en');
    expect(item.duration).toBe(42);
    expect(item.fullText).toBe(text);
    expect(item.preview.length).toBeGreaterThan(0);
    expect(item.preview.endsWith('...')).toBe(true);
  });

  it('createHistoryItem does not append ellipsis for short text', () => {
    const text = 'short text';
    const item = createHistoryItem('name', '/path', 'base', 'en', 42, text);

    expect(item.preview).toBe(text);
  });
});
