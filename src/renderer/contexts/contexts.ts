import { createContext } from 'react';
import type {
  ThemeContextValue,
  HistoryContextValue,
  TranscriptionStateContextValue,
  TranscriptionActionsContextValue,
} from './types';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
export const HistoryContext = createContext<HistoryContextValue | null>(null);
export const TranscriptionStateContext = createContext<TranscriptionStateContextValue | null>(null);
export const TranscriptionActionsContext = createContext<TranscriptionActionsContextValue | null>(
  null
);
