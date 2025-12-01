import type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgress,
  SaveFileOptions,
  SaveFileResult,
  GpuInfo,
  ModelInfo,
  SelectedFile,
  ModelDownloadProgress,
  // UpdateInfo,
  // UpdateDownloadProgress,
  AppInfo,
  MemoryUsage,
  Unsubscribe,
} from '../types';

export type { TranscriptionOptions, TranscriptionResult, SaveFileOptions, SaveFileResult };

export function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

export async function openFileDialog(): Promise<string | null> {
  return window.electronAPI?.openFile() ?? null;
}

export async function getFileInfo(filePath: string): Promise<SelectedFile | null> {
  return window.electronAPI?.getFileInfo(filePath) ?? null;
}

export async function saveFile(options: SaveFileOptions): Promise<SaveFileResult> {
  const result = await window.electronAPI?.saveFile(options);
  return result ?? { success: false, error: 'Electron API not available' };
}

export async function startTranscription(
  options: TranscriptionOptions
): Promise<TranscriptionResult> {
  const result = await window.electronAPI?.startTranscription(options);
  return result ?? { success: false, error: 'Electron API not available' };
}

export async function cancelTranscription(): Promise<{ success: boolean; message?: string }> {
  const result = await window.electronAPI?.cancelTranscription();
  return result ?? { success: false, message: 'Electron API not available' };
}

export function onTranscriptionProgress(
  callback: (progress: TranscriptionProgress) => void
): Unsubscribe {
  return window.electronAPI?.onTranscriptionProgress(callback) ?? (() => {});
}

export async function listModels(): Promise<{ models: ModelInfo[] }> {
  const result = await window.electronAPI?.listModels();
  return result ?? { models: [] };
}

export async function downloadModel(
  modelName: string
): Promise<{ success: boolean; model: string; path: string }> {
  const result = await window.electronAPI?.downloadModel(modelName);
  return result ?? { success: false, model: modelName, path: '' };
}

export function onModelDownloadProgress(
  callback: (progress: ModelDownloadProgress) => void
): Unsubscribe {
  return window.electronAPI?.onModelDownloadProgress(callback) ?? (() => {});
}

export async function getGpuStatus(): Promise<GpuInfo> {
  const result = await window.electronAPI?.getGpuStatus();
  return result ?? { available: false, type: 'cpu', name: 'CPU' };
}

export async function getAppInfo(): Promise<AppInfo> {
  const result = await window.electronAPI?.getAppInfo();
  return result ?? { isDev: true, version: '0.0.0', platform: process.platform as NodeJS.Platform };
}

export async function getMemoryUsage(): Promise<MemoryUsage> {
  const result = await window.electronAPI?.getMemoryUsage();
  return result ?? { heapUsed: 0, heapTotal: 0, rss: 0, external: 0, isTranscribing: false };
}

// export async function checkForUpdates(): Promise<{ success?: boolean; error?: string }> {
//   const result = await window.electronAPI?.checkForUpdates();
//   return result ?? { error: 'Electron API not available' };
// }

// export async function downloadUpdate(): Promise<{ success?: boolean; error?: string }> {
//   const result = await window.electronAPI?.downloadUpdate();
//   return result ?? { error: 'Electron API not available' };
// }

// export function installUpdate(): void {
//   window.electronAPI?.installUpdate();
// }

// export function onUpdateChecking(callback: () => void): Unsubscribe {
//   return window.electronAPI?.onUpdateChecking(callback) ?? (() => {});
// }

// export function onUpdateAvailable(callback: (info: UpdateInfo) => void): Unsubscribe {
//   return window.electronAPI?.onUpdateAvailable(callback) ?? (() => {});
// }

// export function onUpdateNotAvailable(callback: () => void): Unsubscribe {
//   return window.electronAPI?.onUpdateNotAvailable(callback) ?? (() => {});
// }

// export function onUpdateProgress(
//   callback: (progress: UpdateDownloadProgress) => void
// ): Unsubscribe {
//   return window.electronAPI?.onUpdateProgress(callback) ?? (() => {});
// }

// export function onUpdateDownloaded(callback: (info: UpdateInfo) => void): Unsubscribe {
//   return window.electronAPI?.onUpdateDownloaded(callback) ?? (() => {});
// }

// export function onUpdateError(callback: (message: string) => void): Unsubscribe {
//   return window.electronAPI?.onUpdateError(callback) ?? (() => {});
// }
