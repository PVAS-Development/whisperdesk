import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isElectronAvailable,
  openFileDialog,
  getFileInfo,
  saveFile,
  startTranscription,
  cancelTranscription,
  onTranscriptionProgress,
  listModels,
  downloadModel,
  deleteModel,
  onModelDownloadProgress,
  getGpuStatus,
  getAppInfo,
  getMemoryUsage,
} from '@/services';
import type { ElectronAPI } from '@/types/electron';
import { createFullElectronAPIMock } from '@/test/electronAPIMocks';

describe('electronAPI wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { electronAPI?: ElectronAPI }).electronAPI = undefined;
  });

  it('isElectronAvailable reflects presence of window.electronAPI', () => {
    expect(isElectronAvailable()).toBe(false);
    window.electronAPI = createFullElectronAPIMock();
    expect(isElectronAvailable()).toBe(true);
  });

  it('returns safe fallbacks when electronAPI is missing', async () => {
    const openPath = await openFileDialog();
    expect(openPath).toBeNull();

    const info = await getFileInfo('/missing');
    expect(info).toBeNull();

    const saveRes = await saveFile({ defaultName: 'x.txt', content: 'c', format: 'txt' });
    expect(saveRes.success).toBe(false);

    const txRes = await startTranscription({
      filePath: '/f',
      model: 'base',
      language: 'en',
      outputFormat: 'vtt',
    });
    expect(txRes.success).toBe(false);

    const cancelRes = await cancelTranscription();
    expect(cancelRes.success).toBe(false);

    const unsubscribe = onTranscriptionProgress(() => {});
    expect(typeof unsubscribe).toBe('function');

    const models = await listModels();
    expect(models.models).toEqual([]);

    const dl = await downloadModel('base');
    expect(dl.success).toBe(false);

    const del = await deleteModel('base');
    expect(del.success).toBe(false);

    const onDl = onModelDownloadProgress(() => {});
    expect(typeof onDl).toBe('function');

    const gpu = await getGpuStatus();
    expect(gpu.available).toBe(false);

    const appInfo = await getAppInfo();
    expect(appInfo.isDev).toBe(true);

    const mem = await getMemoryUsage();
    expect(mem.heapUsed).toBe(0);
  });

  it('delegates to underlying window.electronAPI when available', async () => {
    const api = createFullElectronAPIMock();
    window.electronAPI = api;

    await openFileDialog();
    expect(api.openFile).toHaveBeenCalled();

    await getFileInfo('/path/file.mp3');
    expect(api.getFileInfo).toHaveBeenCalledWith('/path/file.mp3');

    await saveFile({ defaultName: 'x.txt', content: 'c', format: 'txt' });
    expect(api.saveFile).toHaveBeenCalled();

    await startTranscription({
      filePath: '/f',
      model: 'base',
      language: 'en',
      outputFormat: 'vtt',
    });
    expect(api.startTranscription).toHaveBeenCalled();

    await cancelTranscription();
    expect(api.cancelTranscription).toHaveBeenCalled();

    onTranscriptionProgress(() => {});
    expect(api.onTranscriptionProgress).toHaveBeenCalled();

    await listModels();
    expect(api.listModels).toHaveBeenCalled();

    await downloadModel('base');
    expect(api.downloadModel).toHaveBeenCalledWith('base');

    await deleteModel('base');
    expect(api.deleteModel).toHaveBeenCalledWith('base');

    onModelDownloadProgress(() => {});
    expect(api.onModelDownloadProgress).toHaveBeenCalled();

    await getGpuStatus();
    expect(api.getGpuStatus).toHaveBeenCalled();

    await getAppInfo();
    expect(api.getAppInfo).toHaveBeenCalled();

    await getMemoryUsage();
    expect(api.getMemoryUsage).toHaveBeenCalled();
  });
});
