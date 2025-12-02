import { createContext } from 'react';
import type { ThemeContextValue, HistoryContextValue, TranscriptionContextValue } from './types';

export const ThemeContext = createContext<ThemeContextValue | null>(null);
export const HistoryContext = createContext<HistoryContextValue | null>(null);
export const TranscriptionContext = createContext<TranscriptionContextValue | null>(null);
