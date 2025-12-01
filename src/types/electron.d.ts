import type {
  TranscriptionProgress,
  TranscriptionOptions,
  TranscriptionResult,
  ModelDownloadProgress,
  // UpdateInfo,
  // UpdateDownloadProgress,
  SaveFileOptions,
  SaveFileResult,
  GpuInfo,
  ModelInfo,
  SelectedFile,
  AppInfo,
  MemoryUsage,
  Unsubscribe,
} from './index';

export interface ModelsListResponse {
  models: ModelInfo[];
}

export interface UpdateCheckResult {
  success?: boolean;
  error?: string;
}

export interface DownloadUpdateResult {
  success?: boolean;
  error?: string;
}

export interface CancelResult {
  success: boolean;
  message?: string;
}

export interface WhisperCheckResult {
  available: boolean;
  whisperPath?: string;
  backend?: string;
  gpu?: GpuInfo;
  error?: string;
}

export interface ElectronAPI {
  openFile: () => Promise<string | null>;
  saveFile: (options: SaveFileOptions) => Promise<SaveFileResult>;
  getFileInfo: (filePath: string) => Promise<SelectedFile | null>;
  listModels: () => Promise<ModelsListResponse>;
  getGpuStatus: () => Promise<GpuInfo>;
  downloadModel: (modelName: string) => Promise<{ success: boolean; model: string; path: string }>;
  onModelDownloadProgress: (callback: (data: ModelDownloadProgress) => void) => Unsubscribe;
  startTranscription: (options: TranscriptionOptions) => Promise<TranscriptionResult>;
  cancelTranscription: () => Promise<CancelResult>;
  onTranscriptionProgress: (callback: (data: TranscriptionProgress) => void) => Unsubscribe;
  getAppInfo: () => Promise<AppInfo>;
  getMemoryUsage: () => Promise<MemoryUsage>;
  // checkForUpdates: () => Promise<UpdateCheckResult>;
  // downloadUpdate: () => Promise<DownloadUpdateResult>;
  // installUpdate: () => void;
  // onUpdateChecking: (callback: () => void) => Unsubscribe;
  // onUpdateAvailable: (callback: (info: UpdateInfo) => void) => Unsubscribe;
  // onUpdateNotAvailable: (callback: () => void) => Unsubscribe;
  // onUpdateProgress: (callback: (progress: UpdateDownloadProgress) => void) => Unsubscribe;
  // onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => Unsubscribe;
  // onUpdateError: (callback: (message: string) => void) => Unsubscribe;
  onMenuOpenFile: (callback: () => void) => Unsubscribe;
  onMenuSaveFile: (callback: () => void) => Unsubscribe;
  onMenuCopyTranscription: (callback: () => void) => Unsubscribe;
  onMenuStartTranscription: (callback: () => void) => Unsubscribe;
  onMenuCancelTranscription: (callback: () => void) => Unsubscribe;
  onMenuToggleHistory: (callback: () => void) => Unsubscribe;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
