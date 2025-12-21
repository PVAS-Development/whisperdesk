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
  AppInfo,
  MemoryUsage,
  Unsubscribe,
  UpdateStatus,
} from '../types';

export type { TranscriptionOptions, TranscriptionResult, SaveFileOptions, SaveFileResult };

export function isElectronAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI;
}

export async function openFileDialog(): Promise<string | null> {
  return window.electronAPI?.openFile() ?? null;
}

export async function openMultipleFilesDialog(): Promise<string[] | null> {
  return window.electronAPI?.openMultipleFiles() ?? null;
}

export async function getFileInfo(filePath: string): Promise<SelectedFile | null> {
  return window.electronAPI?.getFileInfo(filePath) ?? null;
}

export function getPathForFile(file: File): string | undefined {
  return window.electronAPI?.getPathForFile(file);
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

export async function deleteModel(
  modelName: string
): Promise<{ success: boolean; error?: string }> {
  const result = await window.electronAPI?.deleteModel(modelName);
  return result ?? { success: false, error: 'Electron API not available' };
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

export async function checkFFmpeg(): Promise<boolean> {
  return (await window.electronAPI?.checkFFmpeg()) ?? false;
}

export async function getAppInfo(): Promise<AppInfo> {
  const result = await window.electronAPI?.getAppInfo();
  return result ?? { isDev: true, version: '0.0.0', platform: process.platform as NodeJS.Platform };
}

export async function getMemoryUsage(): Promise<MemoryUsage> {
  const result = await window.electronAPI?.getMemoryUsage();
  return result ?? { heapUsed: 0, heapTotal: 0, rss: 0, external: 0, isTranscribing: false };
}

export async function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
): Promise<void> {
  await window.electronAPI?.trackEvent(eventName, properties);
}

export async function checkForUpdates(): Promise<{ success: boolean; error?: string }> {
  const result = await window.electronAPI?.checkForUpdates();
  return result ?? { success: false, error: 'Electron API not available' };
}

export async function downloadUpdate(): Promise<{ success: boolean; error?: string }> {
  const result = await window.electronAPI?.downloadUpdate();
  return result ?? { success: false, error: 'Electron API not available' };
}

export function installUpdate(): void {
  window.electronAPI?.installUpdate();
}

export function onUpdateStatus(callback: (status: UpdateStatus) => void): Unsubscribe {
  return window.electronAPI?.onUpdateStatus(callback) ?? (() => {});
}

export async function openExternal(url: string): Promise<void> {
  await window.electronAPI?.openExternal(url);
}

export function onMenuOpenFile(callback: () => void): Unsubscribe {
  return window.electronAPI?.onMenuOpenFile(callback) ?? (() => {});
}

export function onMenuSaveFile(callback: () => void): Unsubscribe {
  return window.electronAPI?.onMenuSaveFile(callback) ?? (() => {});
}

export function onMenuCopyTranscription(callback: () => void): Unsubscribe {
  return window.electronAPI?.onMenuCopyTranscription(callback) ?? (() => {});
}

export function onMenuStartTranscription(callback: () => void): Unsubscribe {
  return window.electronAPI?.onMenuStartTranscription(callback) ?? (() => {});
}

export function onMenuCancelTranscription(callback: () => void): Unsubscribe {
  return window.electronAPI?.onMenuCancelTranscription(callback) ?? (() => {});
}

export function onMenuToggleHistory(callback: () => void): Unsubscribe {
  return window.electronAPI?.onMenuToggleHistory(callback) ?? (() => {});
}
