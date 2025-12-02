import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listModels,
  getGpuStatus,
  downloadModel,
  deleteModel,
  onDownloadProgress,
  isModelDownloaded,
  getModelByName,
  DEFAULT_MODELS,
} from '../services/modelService';
import type { ModelDownloadProgress } from '@/types';
import { overrideElectronAPI } from '@/test/utils';
import { createMockModels } from '@/test/fixtures';

describe('modelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns remote models when available', async () => {
    const modelsResult = createMockModels(1);

    const listModelsSpy = vi.fn().mockResolvedValue({ models: modelsResult });
    overrideElectronAPI({ listModels: listModelsSpy });

    const models = await listModels();
    expect(models).toHaveLength(1);
    expect(models[0]!.name).toBe('tiny');
  });

  it('falls back to DEFAULT_MODELS when remote empty', async () => {
    const listModelsSpy = vi.fn().mockResolvedValue({ models: [] });
    overrideElectronAPI({ listModels: listModelsSpy });

    const models = await listModels();
    expect(models).toEqual(DEFAULT_MODELS);
  });

  it('delegates GPU status to electronAPI', async () => {
    const gpuSpy = vi.fn().mockResolvedValue({ available: false });
    overrideElectronAPI({ getGpuStatus: gpuSpy });

    const status = await getGpuStatus();
    expect(gpuSpy).toHaveBeenCalled();
    expect(status.available).toBe(false);
  });

  it('delegates downloadModel/deleteModel to electronAPI', async () => {
    const downloadSpy = vi.fn().mockResolvedValue({ success: true, model: 'base', path: '/tmp' });
    const deleteSpy = vi.fn().mockResolvedValue({ success: true });
    overrideElectronAPI({ downloadModel: downloadSpy, deleteModel: deleteSpy });

    await downloadModel('base');
    expect(downloadSpy).toHaveBeenCalledWith('base');

    await deleteModel('base');
    expect(deleteSpy).toHaveBeenCalledWith('base');
  });

  it('subscribes to download progress via electronAPI and returns unsubscribe', () => {
    const onProgressSpy = vi.fn().mockReturnValue(() => {});
    overrideElectronAPI({ onModelDownloadProgress: onProgressSpy });

    const callback = vi.fn();
    const unsubscribe = onDownloadProgress(callback);

    expect(onProgressSpy).toHaveBeenCalledWith(callback);
    expect(typeof unsubscribe).toBe('function');

    const progress: ModelDownloadProgress = {
      model: 'base',
      percent: 50,
      status: 'downloading',
      downloaded: '10',
      total: '20',
    };
    callback(progress);
    expect(callback).toHaveBeenCalledWith(progress);
  });

  it('isModelDownloaded returns correct flag for a given model', () => {
    const models = createMockModels(2, [true, false]);

    expect(isModelDownloaded(models, 'tiny')).toBe(true);
    expect(isModelDownloaded(models, 'base')).toBe(false);
    expect(isModelDownloaded(models, 'medium')).toBe(false);
  });

  it('getModelByName returns the matching model or undefined', () => {
    const models = createMockModels(2, [true, false]);

    expect(getModelByName(models, 'tiny')).toEqual(models[0]);
    expect(getModelByName(models, 'unknown')).toBeUndefined();
  });
});
