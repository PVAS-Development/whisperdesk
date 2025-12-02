import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '@/features/history';
import type { HistoryItem } from '@/types';
import { createMockHistoryItem, createHistoryItems } from '@/test/fixtures';
import { useLocalStorageCleanup } from '@/test/testHelpers';

describe('useHistory', () => {
  useLocalStorageCleanup();

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.history).toEqual([]);
    expect(result.current.showHistory).toBe(false);
  });

  it('should load history from localStorage on mount', () => {
    const savedHistory: HistoryItem[] = [createMockHistoryItem()];
    localStorage.setItem('whisperdesk_history', JSON.stringify(savedHistory));

    const { result } = renderHook(() => useHistory());

    expect(result.current.history).toEqual(savedHistory);
  });

  it('should add history item to the beginning', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.addHistoryItem(createMockHistoryItem());
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]).toEqual(expect.objectContaining({ id: 1 }));
  });

  it('should maintain MAX_HISTORY_ITEMS limit (20 items)', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      for (let i = 0; i < 25; i++) {
        const item = createMockHistoryItem({ id: i, fileName: `file${i}.mp3` });
        result.current.addHistoryItem(item);
      }
    });

    const saved = JSON.parse(localStorage.getItem('whisperdesk_history') || '[]');
    expect(saved).toHaveLength(20);
  });

  it('should persist history to localStorage when adding items', () => {
    const { result } = renderHook(() => useHistory());

    const mockItem = createMockHistoryItem();
    act(() => {
      result.current.addHistoryItem(mockItem);
    });

    const saved = JSON.parse(localStorage.getItem('whisperdesk_history') || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(mockItem.id);
  });

  it('should toggle history visibility', () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.showHistory).toBe(false);

    act(() => {
      result.current.toggleHistory();
    });

    expect(result.current.showHistory).toBe(true);

    act(() => {
      result.current.toggleHistory();
    });

    expect(result.current.showHistory).toBe(false);
  });

  it('should set history visibility directly', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.setShowHistory(true);
    });

    expect(result.current.showHistory).toBe(true);

    act(() => {
      result.current.setShowHistory(false);
    });

    expect(result.current.showHistory).toBe(false);
  });

  it('should clear all history', () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.addHistoryItem(createMockHistoryItem());
    });

    expect(result.current.history).toHaveLength(1);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
    expect(localStorage.getItem('whisperdesk_history')).toBeNull();
  });

  it('should remove a history item and persist the change', () => {
    const { result } = renderHook(() => useHistory());
    const firstItem = createMockHistoryItem({ id: 10, fileName: 'keep.mp3' });
    const secondItem = createMockHistoryItem({ id: 11, fileName: 'remove.mp3' });

    act(() => {
      result.current.addHistoryItem(firstItem);
      result.current.addHistoryItem(secondItem);
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.removeHistoryItem(secondItem.id);
    });

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0]!.id).toBe(firstItem.id);

    const saved = JSON.parse(localStorage.getItem('whisperdesk_history') || '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(firstItem.id);
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorage.setItem('whisperdesk_history', 'invalid json');

    const { result } = renderHook(() => useHistory());

    expect(result.current.history).toEqual([]);
  });

  it('should keep newest items when at max capacity', () => {
    const { result } = renderHook(() => useHistory());

    const items = createHistoryItems(20);

    act(() => {
      items.forEach((item) => result.current.addHistoryItem(item));
    });

    let saved = JSON.parse(localStorage.getItem('whisperdesk_history') || '[]');
    expect(saved).toHaveLength(20);

    const newItem = createMockHistoryItem({ id: 20, fileName: 'file20.mp3' });

    act(() => {
      result.current.addHistoryItem(newItem);
    });

    saved = JSON.parse(localStorage.getItem('whisperdesk_history') || '[]');
    expect(saved).toHaveLength(20);
    expect(saved[0].id).toBe(20);
    expect(saved.some((item: HistoryItem) => item.id === 0)).toBe(false);
  });

  it('should call onSelect callback and hide history when selecting item', () => {
    const { result } = renderHook(() => useHistory());
    const mockItem = createMockHistoryItem();
    const onSelectMock = vi.fn();

    act(() => {
      result.current.addHistoryItem(mockItem);
      result.current.setShowHistory(true);
    });

    expect(result.current.showHistory).toBe(true);

    act(() => {
      result.current.selectHistoryItem(mockItem, onSelectMock);
    });

    expect(onSelectMock).toHaveBeenCalledWith(mockItem);
    expect(result.current.showHistory).toBe(false);
  });

  it('should handle localStorage save failure gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalSetItem = localStorage.setItem.bind(localStorage);

    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.addHistoryItem(createMockHistoryItem());
    });

    expect(consoleSpy).toHaveBeenCalled();

    localStorage.setItem = originalSetItem;
    consoleSpy.mockRestore();
  });
});
