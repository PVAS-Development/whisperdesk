import '@testing-library/jest-dom';
import { vi } from 'vitest';
import type { ElectronAPI } from '../types/electron';

Element.prototype.scrollIntoView = vi.fn();

const mockElectronAPI: ElectronAPI = {
  openFile: vi.fn().mockResolvedValue(null),
  saveFile: vi.fn().mockResolvedValue({ success: false, error: 'Not implemented' }),
  getFileInfo: vi.fn().mockResolvedValue(null),
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
