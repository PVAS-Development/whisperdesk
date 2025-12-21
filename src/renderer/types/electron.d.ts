import type {
  TranscriptionProgress,
  TranscriptionOptions,
  TranscriptionResult,
  ModelDownloadProgress,
  SaveFileOptions,
  SaveFileResult,
  GpuInfo,
  ModelInfo,
  SelectedFile,
  AppInfo,
  MemoryUsage,
  Unsubscribe,
  UpdateStatus,
} from './index';

export interface ModelsListResponse {
  models: ModelInfo[];
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
  openMultipleFiles: () => Promise<string[] | null>;
  saveFile: (options: SaveFileOptions) => Promise<SaveFileResult>;
  getFileInfo: (filePath: string) => Promise<SelectedFile | null>;
  getPathForFile: (file: File) => string;
  listModels: () => Promise<ModelsListResponse>;
  deleteModel: (modelName: string) => Promise<{ success: boolean; error?: string }>;
  getGpuStatus: () => Promise<GpuInfo>;
  checkFFmpeg: () => Promise<boolean>;
  downloadModel: (modelName: string) => Promise<{ success: boolean; model: string; path: string }>;
  onModelDownloadProgress: (callback: (data: ModelDownloadProgress) => void) => Unsubscribe;
  startTranscription: (options: TranscriptionOptions) => Promise<TranscriptionResult>;
  cancelTranscription: () => Promise<CancelResult>;
  onTranscriptionProgress: (callback: (data: TranscriptionProgress) => void) => Unsubscribe;
  getAppInfo: () => Promise<AppInfo>;
  getMemoryUsage: () => Promise<MemoryUsage>;
  trackEvent: (
    eventName: string,
    properties?: Record<string, string | number | boolean>
  ) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  onMenuOpenFile: (callback: () => void) => Unsubscribe;
  onMenuSaveFile: (callback: () => void) => Unsubscribe;
  onMenuCopyTranscription: (callback: () => void) => Unsubscribe;
  onMenuStartTranscription: (callback: () => void) => Unsubscribe;
  onMenuCancelTranscription: (callback: () => void) => Unsubscribe;
  onMenuToggleHistory: (callback: () => void) => Unsubscribe;
  checkForUpdates: () => Promise<{ success: boolean; error?: string }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => void;
  onUpdateStatus: (callback: (data: UpdateStatus) => void) => Unsubscribe;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
