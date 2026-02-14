import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type {
  TranscriptionOptions,
  SaveFileOptions,
  ModelDownloadProgress,
  TranscriptionProgress,
  UpdateStatus,
  AppSettings,
  HttTranscriptionResult,
} from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openMultipleFiles: () => ipcRenderer.invoke('dialog:openMultipleFiles'),
  saveFile: (options: SaveFileOptions) => ipcRenderer.invoke('dialog:saveFile', options),

  getFileInfo: (filePath: string) => ipcRenderer.invoke('file:getInfo', filePath),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  listModels: () => ipcRenderer.invoke('models:list'),
  getGpuStatus: () => ipcRenderer.invoke('models:gpuStatus'),
  checkFFmpeg: () => ipcRenderer.invoke('system:checkFFmpeg'),
  downloadModel: (modelName: string) => ipcRenderer.invoke('models:download', modelName),
  deleteModel: (modelName: string) => ipcRenderer.invoke('models:delete', modelName),
  onModelDownloadProgress: (callback: (data: ModelDownloadProgress) => void) => {
    ipcRenderer.on('models:downloadProgress', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('models:downloadProgress');
  },

  startTranscription: (options: TranscriptionOptions) =>
    ipcRenderer.invoke('transcribe:start', options),
  cancelTranscription: () => ipcRenderer.invoke('transcribe:cancel'),
  onTranscriptionProgress: (callback: (data: TranscriptionProgress) => void) => {
    ipcRenderer.on('transcribe:progress', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('transcribe:progress');
  },

  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getMemoryUsage: () => ipcRenderer.invoke('app:getMemoryUsage'),
  trackEvent: (eventName: string, properties?: Record<string, string | number | boolean>) =>
    ipcRenderer.invoke('analytics:track', eventName, properties),

  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),

  onMenuOpenFile: (callback: () => void) => {
    ipcRenderer.on('menu:openFile', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:openFile');
  },
  onMenuSaveFile: (callback: () => void) => {
    ipcRenderer.on('menu:saveFile', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:saveFile');
  },
  onMenuCopyTranscription: (callback: () => void) => {
    ipcRenderer.on('menu:copyTranscription', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:copyTranscription');
  },
  onMenuStartTranscription: (callback: () => void) => {
    ipcRenderer.on('menu:startTranscription', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:startTranscription');
  },
  onMenuCancelTranscription: (callback: () => void) => {
    ipcRenderer.on('menu:cancelTranscription', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:cancelTranscription');
  },
  onMenuToggleHistory: (callback: () => void) => {
    ipcRenderer.on('menu:toggleHistory', () => callback());
    return () => ipcRenderer.removeAllListeners('menu:toggleHistory');
  },

  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateStatus: (callback: (data: UpdateStatus) => void) => {
    ipcRenderer.on('update:status', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('update:status');
  },

  // Settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings),

  // Hold-to-Transcribe
  onHttStartRecording: (callback: () => void) => {
    ipcRenderer.on('htt:startRecording', () => callback());
    return () => ipcRenderer.removeAllListeners('htt:startRecording');
  },
  onHttStopRecording: (callback: () => void) => {
    ipcRenderer.on('htt:stopRecording', () => callback());
    return () => ipcRenderer.removeAllListeners('htt:stopRecording');
  },
  onHttTranscriptionResult: (callback: (data: HttTranscriptionResult) => void) => {
    ipcRenderer.on('htt:transcriptionResult', (_event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('htt:transcriptionResult');
  },
  onHttAccessibilityRequired: (callback: () => void) => {
    ipcRenderer.on('htt:accessibilityRequired', () => callback());
    return () => ipcRenderer.removeAllListeners('htt:accessibilityRequired');
  },
  httSaveAudio: (buffer: ArrayBuffer) => ipcRenderer.invoke('htt:saveAudio', buffer),
  httRequestAccessibility: () => ipcRenderer.invoke('htt:requestAccessibility'),
  httUpdateSettings: () => ipcRenderer.invoke('htt:updateSettings'),
});
