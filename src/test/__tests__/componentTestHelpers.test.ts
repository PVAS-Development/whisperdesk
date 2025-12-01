import { describe, it, expect, vi } from 'vitest';
import {
  setupSettingsPanelMocks,
  setupFileMocks,
  setupModelMocks,
  setupGpuMocks,
  waitForCall,
  waitForCallWith,
  createDownloadProgressMock,
} from '../componentTestHelpers';
import { createMockModels, MOCK_GPU_INFO } from '../fixtures';

describe('componentTestHelpers', () => {
  describe('setupSettingsPanelMocks', () => {
    it('sets up settings panel mocks', () => {
      const models = createMockModels(2);
      setupSettingsPanelMocks(models, MOCK_GPU_INFO);
      expect(window.electronAPI?.listModels).toBeDefined();
    });

    it('allows custom overrides', () => {
      const customMock = vi.fn().mockResolvedValue({ value: 'custom' });
      setupSettingsPanelMocks(undefined, undefined, {
        customMethod: customMock,
      });
      expect(window.electronAPI).toBeDefined();
    });
  });

  describe('createDownloadProgressMock', () => {
    it('creates progress mock with callbacks', () => {
      const { mock, callbacks } = createDownloadProgressMock();
      expect(mock).toBeDefined();
      expect(callbacks).toHaveLength(0);
    });

    it('triggers callback immediately if enabled', () => {
      const { triggerCallback } = createDownloadProgressMock(true);
      let called = false;
      triggerCallback({ test: true });
      called = true;
      expect(called).toBe(true);
    });

    it('supports different progress statuses', () => {
      const { mock: progressMock } = createDownloadProgressMock(false, 'progress');
      const { mock: errorMock } = createDownloadProgressMock(false, 'error');
      const { mock: completeMock } = createDownloadProgressMock(false, 'complete');
      expect(progressMock).toBeDefined();
      expect(errorMock).toBeDefined();
      expect(completeMock).toBeDefined();
    });
  });

  describe('setupFileMocks', () => {
    it('sets up file operation mocks', () => {
      setupFileMocks('/path/to/file.mp3', true);
      expect(window.electronAPI?.openFile).toBeDefined();
      expect(window.electronAPI?.saveFile).toBeDefined();
    });

    it('handles null file path', () => {
      setupFileMocks(null, true);
      expect(window.electronAPI?.openFile).toBeDefined();
    });
  });

  describe('setupModelMocks', () => {
    it('sets up model mocks with default models', () => {
      setupModelMocks();
      expect(window.electronAPI?.listModels).toBeDefined();
    });

    it('sets up with custom models', () => {
      const customModels = createMockModels(2);
      setupModelMocks({ models: customModels });
      expect(window.electronAPI?.listModels).toBeDefined();
    });
  });

  describe('setupGpuMocks', () => {
    it('sets up GPU mocks with availability', () => {
      setupGpuMocks(true, 'Test GPU', 'metal');
      expect(window.electronAPI?.getGpuStatus).toBeDefined();
    });

    it('handles unavailable GPU', () => {
      setupGpuMocks(false, 'No GPU', 'none');
      expect(window.electronAPI?.getGpuStatus).toBeDefined();
    });
  });

  describe('waitForCall', () => {
    it('waits for mock function to be called', async () => {
      const mock = vi.fn();
      setTimeout(() => mock(), 10);
      await waitForCall(mock, 100);
      expect(mock).toHaveBeenCalled();
    });
  });

  describe('waitForCallWith', () => {
    it('waits for mock to be called with specific args', async () => {
      const mock = vi.fn();
      setTimeout(() => mock('test', 123), 10);
      await waitForCallWith(mock, 'test', 123);
      expect(mock).toHaveBeenCalledWith('test', 123);
    });
  });
});
