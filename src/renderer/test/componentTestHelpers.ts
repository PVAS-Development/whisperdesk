import { vi, expect } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import type { ModelInfo } from '@/types';
import { overrideElectronAPI } from './utils';
import { createMockModels, MOCK_GPU_INFO, createMockFile, createMockHistoryItem } from './fixtures';

export function setupSettingsPanelMocks(
  models = createMockModels(),
  gpuInfo = MOCK_GPU_INFO,
  additionalOverrides: Record<string, unknown> = {}
): void {
  overrideElectronAPI({
    listModels: vi.fn().mockResolvedValue({ models }),
    getGpuStatus: vi.fn().mockResolvedValue(gpuInfo),
    onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
    ...additionalOverrides,
  });
}

export function createDownloadProgressMock(
  simulateImmediate = true,
  status: 'progress' | 'error' | 'complete' = 'progress',
  data: Record<string, unknown> = { percent: 50, remainingTime: '2m' }
): {
  mock: ReturnType<typeof vi.fn>;
  callbacks: Array<(data: Record<string, unknown>) => void>;
  triggerCallback: (data: Record<string, unknown>) => void;
} {
  const callbacks: Array<(data: Record<string, unknown>) => void> = [];

  const mock = vi.fn((callback: (data: Record<string, unknown>) => void) => {
    callbacks.push(callback);
    if (simulateImmediate) {
      setTimeout(() => {
        callback({ status, ...data });
      }, 0);
    }
    return vi.fn();
  });

  return {
    mock,
    callbacks,
    triggerCallback: (customData: Record<string, unknown>) => {
      callbacks.forEach((cb) => cb(customData));
    },
  };
}

export function setupFileMocks(
  openFilePath: string | null = '/path/to/file.mp3',
  saveSuccess = true
): void {
  overrideElectronAPI({
    openFile: vi.fn().mockResolvedValue(openFilePath),
    getFileInfo: vi
      .fn()
      .mockResolvedValue(openFilePath ? createMockFile({ path: openFilePath }) : null),
    saveFile: vi.fn().mockResolvedValue({
      success: saveSuccess,
      filePath: '/saved.txt',
    }),
  });
}

export async function renderAndWait(
  component: ReactElement,
  expectText?: string | RegExp,
  options: Record<string, unknown> = {}
) {
  const result = render(component, options);

  if (expectText) {
    await waitFor(() => {
      expect(screen.getByText(expectText)).toBeInTheDocument();
    });
  }

  return result;
}

export function setupHistoryMocks(historyItems = [createMockHistoryItem()]): void {
  if (!window.electronAPI) return;

  const storedHistory = [...historyItems];

  Object.assign(window.electronAPI, {
    getHistory: vi.fn().mockResolvedValue({ items: storedHistory }),
    clearHistory: vi.fn().mockImplementation(() => {
      storedHistory.length = 0;
      return Promise.resolve({ success: true });
    }),
  });
}

export function setupModelMocks(
  options: {
    models?: ModelInfo[];
  } = {}
): void {
  const { models = createMockModels() } = options;

  overrideElectronAPI({
    listModels: vi.fn().mockResolvedValue({ models }),
    downloadModel: vi.fn().mockResolvedValue({ success: true, model: 'base', path: '/tmp' }),
    deleteModel: vi.fn().mockResolvedValue({ success: true }),
  });
}

export function setupGpuMocks(available = true, name = 'GPU', type: string = 'gpu'): void {
  overrideElectronAPI({
    getGpuStatus: vi.fn().mockResolvedValue({
      available,
      type,
      name,
    }),
  });
}

export async function waitForCall(mockFn: ReturnType<typeof vi.fn>, timeout = 1000): Promise<void> {
  return waitFor(
    () => {
      expect(mockFn).toHaveBeenCalled();
    },
    { timeout }
  );
}

export async function waitForCallWith(
  mockFn: ReturnType<typeof vi.fn>,
  ...args: unknown[]
): Promise<void> {
  return waitFor(() => {
    expect(mockFn).toHaveBeenCalledWith(...args);
  });
}
