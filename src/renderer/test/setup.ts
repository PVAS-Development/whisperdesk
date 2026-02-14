import '@testing-library/jest-dom';
import { vi } from 'vitest';
import type { ElectronAPI } from '../types/electron';

Element.prototype.scrollIntoView = vi.fn();

// Mock navigator.mediaDevices.enumerateDevices for audio device selection tests
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    enumerateDevices: vi.fn().mockResolvedValue([]),
    getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }),
  },
  writable: true,
});

const mockElectronAPI: ElectronAPI = {
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
    name: 'Speakly',
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
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

const localStorageStore: Record<string, string> = {};

vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach((key) => {
      delete localStorageStore[key];
    });
  }),
});

vi.mock('../services/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    isEnabled: vi.fn(() => true),
  },
}));
