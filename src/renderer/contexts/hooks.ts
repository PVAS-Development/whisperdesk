import { useContext } from 'react';
import { ThemeContext, HistoryContext, TranscriptionContext } from './contexts';
import type { ThemeContextValue, HistoryContextValue, TranscriptionContextValue } from './types';

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within AppProvider');
  }
  return context;
}

export function useAppHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useAppHistory must be used within AppProvider');
  }
  return context;
}

export function useAppTranscription(): TranscriptionContextValue {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error('useAppTranscription must be used within AppProvider');
  }
  return context;
}
