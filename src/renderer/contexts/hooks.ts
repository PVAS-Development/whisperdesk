import { useContext } from 'react';
import {
  ThemeContext,
  HistoryContext,
  TranscriptionContext,
  TranscriptionStateContext,
  TranscriptionActionsContext,
} from './contexts';
import type {
  ThemeContextValue,
  HistoryContextValue,
  TranscriptionContextValue,
  TranscriptionStateContextValue,
  TranscriptionActionsContextValue,
} from './types';

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

export function useAppTranscriptionState(): TranscriptionStateContextValue {
  const context = useContext(TranscriptionStateContext);
  if (!context) {
    throw new Error('useAppTranscriptionState must be used within AppProvider');
  }
  return context;
}

export function useAppTranscriptionActions(): TranscriptionActionsContextValue {
  const context = useContext(TranscriptionActionsContext);
  if (!context) {
    throw new Error('useAppTranscriptionActions must be used within AppProvider');
  }
  return context;
}
