import { useState, useCallback } from 'react';
import type { HistoryItem } from '../../../types';
import { STORAGE_KEYS } from '../../../utils/storage';
import { APP_CONFIG } from '../../../config';

const STORAGE_KEY = STORAGE_KEYS.HISTORY;
const MAX_HISTORY_ITEMS = APP_CONFIG.MAX_HISTORY_ITEMS;

const loadHistoryFromStorage = (): HistoryItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as HistoryItem[];
    }
    return [];
  } catch {
    return [];
  }
};

const saveHistoryToStorage = (history: HistoryItem[]): void => {
  try {
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
};

interface UseHistoryReturn {
  history: HistoryItem[];
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  toggleHistory: () => void;
  addHistoryItem: (item: HistoryItem) => void;
  clearHistory: () => void;
  selectHistoryItem: (item: HistoryItem, onSelect: (item: HistoryItem) => void) => void;
  removeHistoryItem: (itemId: number) => void;
}

export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryItem[]>(loadHistoryFromStorage);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const toggleHistory = useCallback((): void => {
    setShowHistory((prev) => !prev);
  }, []);

  const addHistoryItem = useCallback((item: HistoryItem): void => {
    setHistory((prev) => {
      const newHistory = [item, ...prev];
      saveHistoryToStorage(newHistory);
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback((): void => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeHistoryItem = useCallback((itemId: number): void => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== itemId);
      saveHistoryToStorage(updated);
      return updated;
    });
  }, []);

  const selectHistoryItem = useCallback(
    (item: HistoryItem, onSelect: (item: HistoryItem) => void): void => {
      onSelect(item);
      setShowHistory(false);
    },
    []
  );

  return {
    history,
    showHistory,
    setShowHistory,
    toggleHistory,
    addHistoryItem,
    clearHistory,
    removeHistoryItem,
    selectHistoryItem,
  };
}
