import type {
  HistoryItem,
  SelectedFile,
  TranscriptionSettings,
  TranscriptionProgress,
  OutputFormat,
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
  removeHistoryItem: (itemId: number) => void;
  selectHistoryItem: (item: HistoryItem) => void;
}

export interface TranscriptionContextValue {
  selectedFile: SelectedFile | null;
  settings: TranscriptionSettings;
  isTranscribing: boolean;
  progress: TranscriptionProgress;
  transcriptionStartTime: number | null;
  transcription: string;
  error: string | null;
  modelDownloaded: boolean;
  copySuccess: boolean;

  setSelectedFile: (file: SelectedFile | null) => void;
  setSettings: (settings: TranscriptionSettings) => void;
  setModelDownloaded: (downloaded: boolean) => void;
  handleFileSelect: (file: SelectedFile) => void;
  handleTranscribe: () => Promise<void>;
  handleCancel: () => Promise<void>;
  handleSave: (format?: OutputFormat) => Promise<void>;
  handleCopy: () => Promise<void>;
}
