import type {
  HistoryItem,
  SelectedFile,
  TranscriptionSettings,
  OutputFormat,
  QueueItem,
} from '../types';
import type { Theme } from '../hooks';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

export interface HistoryContextValue {
  history: HistoryItem[];
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  toggleHistory: () => void;
  clearHistory: () => void;
  removeHistoryItem: (itemId: string) => void;
  selectHistoryItem: (item: HistoryItem) => void;
}

export interface TranscriptionStateContextValue {
  selectedFile: SelectedFile | null;
  settings: TranscriptionSettings;
  isTranscribing: boolean;
  transcription: string;
  error: string | null;
  modelDownloaded: boolean;
  copySuccess: boolean;
  queue: QueueItem[];
  selectedQueueItemId: string | null;
}

export interface TranscriptionActionsContextValue {
  setSelectedFile: (file: SelectedFile | null) => void;
  setSettings: (settings: TranscriptionSettings) => void;
  setModelDownloaded: (downloaded: boolean) => void;
  handleTranscribe: () => Promise<void>;
  handleCancel: () => Promise<void>;
  handleSave: (format?: OutputFormat) => Promise<void>;
  handleCopy: () => Promise<void>;
  handleFilesSelect: (files: SelectedFile[]) => void;
  removeFromQueue: (id: string) => void;
  clearCompletedFromQueue: () => void;
  selectQueueItem: (id: string) => void;
}

export interface TranscriptionContextValue
  extends TranscriptionStateContextValue, TranscriptionActionsContextValue {}
