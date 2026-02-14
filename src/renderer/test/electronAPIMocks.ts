import { vi } from 'vitest';
import type { ElectronAPI } from '@/types/electron';
import type { ModelInfo, ModelDownloadProgress } from '@/types';

export const createDefaultElectronAPIMock = (): ElectronAPI => ({
  openFile: vi.fn().mockResolvedValue(null),
  openMultipleFiles: vi.fn().mockResolvedValue(null),
  saveFile: vi.fn().mockResolvedValue({ success: false, error: 'Not implemented' }),
  getFileInfo: vi.fn().mockResolvedValue(null),
  getPathForFile: vi.fn().mockReturnValue('/path/to/file'),
  listModels: vi.fn().mockResolvedValue({ models: [] }),
  deleteModel: vi.fn().mockResolvedValue({ success: true }),
  checkFFmpeg: vi.fn().mockResolvedValue(true),
  getGpuStatus: vi.fn().mockResolvedValue({ available: false }),
  downloadModel: vi
    .fn()
    .mockResolvedValue({ success: true, model: 'base', path: '/path/to/model' }),
  onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
  startTranscription: vi.fn().mockResolvedValue({
    success: true,
    text: 'Transcribed text',
    duration: 10,
    language: 'en',
  }),
  cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
  onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
  getAppInfo: vi.fn().mockResolvedValue({
    version: '1.0.0',
    name: 'WhisperDesk',
  }),
  getMemoryUsage: vi.fn().mockResolvedValue({
    heapUsed: 100 * 1024 * 1024,
    heapTotal: 200 * 1024 * 1024,
  }),
  trackEvent: vi.fn().mockResolvedValue(undefined),
  openExternal: vi.fn().mockResolvedValue(undefined),
  onMenuOpenFile: vi.fn().mockReturnValue(() => {}),
  onMenuSaveFile: vi.fn().mockReturnValue(() => {}),
  onMenuCopyTranscription: vi.fn().mockReturnValue(() => {}),
  onMenuStartTranscription: vi.fn().mockReturnValue(() => {}),
  onMenuCancelTranscription: vi.fn().mockReturnValue(() => {}),
  onMenuToggleHistory: vi.fn().mockReturnValue(() => {}),
  checkForUpdates: vi.fn().mockResolvedValue({ success: true }),
  downloadUpdate: vi.fn().mockResolvedValue({ success: true }),
  installUpdate: vi.fn(),
  onUpdateStatus: vi.fn().mockReturnValue(() => {}),
  loadSettings: vi.fn().mockResolvedValue({
    holdToTranscribe: {
      enabled: true,
      shortcutMode: 'hold',
      shortcutKeyCode: 3640,
      model: 'base',
      language: 'auto',
      autoPaste: true,
      audioDeviceId: '',
      translateToEnglish: false,
      translation: {
        enabled: false,
        provider: 'google',
        targetLanguage: 'English',
        apiKey: '',
        customEndpoint: '',
        customModel: '',
        systemPrompt: '',
      },
    },
  }),
  saveSettings: vi.fn().mockResolvedValue({ success: true }),
  onHttStartRecording: vi.fn().mockReturnValue(() => {}),
  onHttStopRecording: vi.fn().mockReturnValue(() => {}),
  onHttTranscriptionResult: vi.fn().mockReturnValue(() => {}),
  onHttAccessibilityRequired: vi.fn().mockReturnValue(() => {}),
  onHttModelNotDownloaded: vi.fn().mockReturnValue(() => {}),
  httSaveAudio: vi.fn().mockResolvedValue({ success: true }),
  httRequestAccessibility: vi.fn().mockResolvedValue({ success: true }),
  httUpdateSettings: vi.fn().mockResolvedValue({ success: true }),
  testTranslation: vi.fn().mockResolvedValue({ success: true }),
});

export const createFullElectronAPIMock = (): ElectronAPI => ({
  openFile: vi.fn().mockResolvedValue('/path/file.mp3'),
  openMultipleFiles: vi.fn().mockResolvedValue(['/path/file.mp3']),
  saveFile: vi.fn().mockResolvedValue({ success: true, filePath: '/saved.txt' }),
  getFileInfo: vi.fn().mockResolvedValue({ name: 'file.mp3', path: '/path/file.mp3', size: 10 }),
  getPathForFile: vi.fn().mockReturnValue('/path/file.mp3'),
  listModels: vi.fn().mockResolvedValue({ models: [] }),
  deleteModel: vi.fn().mockResolvedValue({ success: true }),
  checkFFmpeg: vi.fn().mockResolvedValue(true),
  getGpuStatus: vi.fn().mockResolvedValue({ available: true, type: 'gpu', name: 'GPU' }),
  downloadModel: vi.fn().mockResolvedValue({ success: true, model: 'base', path: '/model' }),
  onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
  startTranscription: vi.fn().mockResolvedValue({ success: true, text: 'ok' }),
  cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
  onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
  getAppInfo: vi.fn().mockResolvedValue({ isDev: false, version: '1.0.0', platform: 'darwin' }),
  getMemoryUsage: vi
    .fn()
    .mockResolvedValue({ heapUsed: 1, heapTotal: 2, rss: 3, external: 4, isTranscribing: false }),
  trackEvent: vi.fn().mockResolvedValue(undefined),
  openExternal: vi.fn().mockResolvedValue(undefined),
  onMenuOpenFile: vi.fn().mockReturnValue(() => {}),
  onMenuSaveFile: vi.fn().mockReturnValue(() => {}),
  onMenuCopyTranscription: vi.fn().mockReturnValue(() => {}),
  onMenuStartTranscription: vi.fn().mockReturnValue(() => {}),
  onMenuCancelTranscription: vi.fn().mockReturnValue(() => {}),
  onMenuToggleHistory: vi.fn().mockReturnValue(() => {}),
  checkForUpdates: vi.fn().mockResolvedValue({ success: true }),
  downloadUpdate: vi.fn().mockResolvedValue({ success: true }),
  installUpdate: vi.fn(),
  onUpdateStatus: vi.fn().mockReturnValue(() => {}),
  loadSettings: vi.fn().mockResolvedValue({
    holdToTranscribe: {
      enabled: true,
      shortcutMode: 'hold',
      shortcutKeyCode: 3640,
      model: 'base',
      language: 'auto',
      autoPaste: true,
      audioDeviceId: '',
      translateToEnglish: false,
      translation: {
        enabled: false,
        provider: 'google',
        targetLanguage: 'English',
        apiKey: '',
        customEndpoint: '',
        customModel: '',
        systemPrompt: '',
      },
    },
  }),
  saveSettings: vi.fn().mockResolvedValue({ success: true }),
  onHttStartRecording: vi.fn().mockReturnValue(() => {}),
  onHttStopRecording: vi.fn().mockReturnValue(() => {}),
  onHttTranscriptionResult: vi.fn().mockReturnValue(() => {}),
  onHttAccessibilityRequired: vi.fn().mockReturnValue(() => {}),
  onHttModelNotDownloaded: vi.fn().mockReturnValue(() => {}),
  httSaveAudio: vi.fn().mockResolvedValue({ success: true }),
  httRequestAccessibility: vi.fn().mockResolvedValue({ success: true }),
  httUpdateSettings: vi.fn().mockResolvedValue({ success: true }),
  testTranslation: vi.fn().mockResolvedValue({ success: true }),
});

export class ElectronAPIMockBuilder {
  private api: Partial<ElectronAPI>;

  constructor(base: Partial<ElectronAPI> = createDefaultElectronAPIMock()) {
    this.api = { ...base };
  }

  withModels(models: ModelInfo[]): this {
    this.api.listModels = vi.fn().mockResolvedValue({ models });
    return this;
  }

  withGpuStatus(available: boolean, name = 'Test GPU'): this {
    this.api.getGpuStatus = vi.fn().mockResolvedValue({ available, type: 'gpu', name });
    return this;
  }

  withTranscriptionResult(text: string, success = true): this {
    this.api.startTranscription = vi.fn().mockResolvedValue({
      success,
      text,
      duration: 10,
      language: 'en',
    });
    return this;
  }

  withDownloadModel(success = true): this {
    this.api.downloadModel = vi.fn().mockResolvedValue({ success, model: 'base', path: '/tmp' });
    return this;
  }

  withDeleteModel(success = true): this {
    this.api.deleteModel = vi.fn().mockResolvedValue({ success });
    return this;
  }

  withDownloadProgress(callback: (fn: (data: ModelDownloadProgress) => void) => () => void): this {
    this.api.onModelDownloadProgress = vi.fn(callback);
    return this;
  }

  withFileOpen(path: string | null): this {
    this.api.openFile = vi.fn().mockResolvedValue(path);
    return this;
  }

  withFileSave(success = true, filePath = '/saved.txt'): this {
    this.api.saveFile = vi.fn().mockResolvedValue({ success, filePath });
    return this;
  }

  with(overrides: Partial<ElectronAPI>): this {
    this.api = { ...this.api, ...overrides };
    return this;
  }

  build(): ElectronAPI {
    return this.api as ElectronAPI;
  }
}
