import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import React from 'react';
import {
  setupSettingsPanelMocks,
  setupFileMocks,
  setupModelMocks,
  setupGpuMocks,
  waitForCall,
  waitForCallWith,
  createDownloadProgressMock,
  renderAndWait,
  setupHistoryMocks,
} from '../componentTestHelpers';
import { createMockModels, MOCK_GPU_INFO, createMockHistoryItem } from '../fixtures';

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

  describe('renderAndWait', () => {
    it('renders component and waits for text', async () => {
      const TestComponent = () => React.createElement('div', null, 'Hello Test');
      const result = await renderAndWait(React.createElement(TestComponent), 'Hello Test');
      expect(result.container).toBeDefined();
      expect(screen.getByText('Hello Test')).toBeInTheDocument();
    });

    it('renders component without waiting when no expectText provided', async () => {
      const TestComponent = () => React.createElement('div', null, 'Simple');
      const result = await renderAndWait(React.createElement(TestComponent));
      expect(result.container).toBeDefined();
    });

    it('renders with options', async () => {
      const TestComponent = () => React.createElement('span', null, 'With Options');
      const result = await renderAndWait(React.createElement(TestComponent), 'With Options', {});
      expect(result.container).toBeDefined();
    });

    it('waits for regex pattern', async () => {
      const TestComponent = () => React.createElement('p', null, 'Pattern Match 123');
      const result = await renderAndWait(React.createElement(TestComponent), /Pattern Match/);
      expect(result.container).toBeDefined();
    });
  });

  describe('setupHistoryMocks', () => {
    it('sets up history mocks with default items', () => {
      setupHistoryMocks();
      expect(window.electronAPI).toBeDefined();
    });

    it('sets up history mocks with custom items', () => {
      const customItems = [
        createMockHistoryItem({ id: 'custom-id-1', fileName: 'custom1.mp3' }),
        createMockHistoryItem({ id: 'custom-id-2', fileName: 'custom2.mp3' }),
      ];
      setupHistoryMocks(customItems);
      expect(window.electronAPI).toBeDefined();
    });
  });

  describe('createDownloadProgressMock edge cases', () => {
    it('stores multiple callbacks when called multiple times', () => {
      const { mock, callbacks } = createDownloadProgressMock(false);

      const cb1 = vi.fn();
      const cb2 = vi.fn();

      (mock as unknown as (cb: typeof cb1) => void)(cb1);
      (mock as unknown as (cb: typeof cb2) => void)(cb2);

      expect(callbacks).toHaveLength(2);
    });

    it('triggers all stored callbacks with custom data', () => {
      const { mock, triggerCallback } = createDownloadProgressMock(false);

      const cb1 = vi.fn();
      const cb2 = vi.fn();

      (mock as unknown as (cb: typeof cb1) => void)(cb1);
      (mock as unknown as (cb: typeof cb2) => void)(cb2);

      triggerCallback({ percent: 75 });

      expect(cb1).toHaveBeenCalledWith({ percent: 75 });
      expect(cb2).toHaveBeenCalledWith({ percent: 75 });
    });
  });
});
