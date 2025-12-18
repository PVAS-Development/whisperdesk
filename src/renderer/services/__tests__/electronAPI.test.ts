import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isElectronAvailable,
  openFileDialog,
  getFileInfo,
  getPathForFile,
  saveFile,
  startTranscription,
  cancelTranscription,
  onTranscriptionProgress,
  listModels,
  downloadModel,
  deleteModel,
  onModelDownloadProgress,
  getGpuStatus,
  checkFFmpeg,
  getAppInfo,
  getMemoryUsage,
  trackEvent,
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  onUpdateStatus,
  openExternal,
  onMenuOpenFile,
  onMenuSaveFile,
  onMenuCopyTranscription,
  onMenuStartTranscription,
  onMenuCancelTranscription,
  onMenuToggleHistory,
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

    const pathForFile = getPathForFile(new File([''], 'test.mp3'));
    expect(pathForFile).toBeUndefined();

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

    const unsubscribeProgress = onTranscriptionProgress(() => {});
    expect(typeof unsubscribeProgress).toBe('function');
    unsubscribeProgress();

    const models = await listModels();
    expect(models.models).toEqual([]);

    const dl = await downloadModel('base');
    expect(dl.success).toBe(false);

    const del = await deleteModel('base');
    expect(del.success).toBe(false);

    const unsubscribeDownload = onModelDownloadProgress(() => {});
    expect(typeof unsubscribeDownload).toBe('function');
    unsubscribeDownload();

    const gpu = await getGpuStatus();
    expect(gpu.available).toBe(false);

    const ffmpeg = await checkFFmpeg();
    expect(ffmpeg).toBe(false);

    const appInfo = await getAppInfo();
    expect(appInfo.isDev).toBe(true);

    const mem = await getMemoryUsage();
    expect(mem.heapUsed).toBe(0);

    await expect(trackEvent('test_event', { prop: 'value' })).resolves.toBeUndefined();

    const updateCheck = await checkForUpdates();
    expect(updateCheck.success).toBe(false);

    const updateDownload = await downloadUpdate();
    expect(updateDownload.success).toBe(false);

    expect(() => installUpdate()).not.toThrow();

    const unsubscribeUpdate = onUpdateStatus(() => {});
    expect(typeof unsubscribeUpdate).toBe('function');
    unsubscribeUpdate();

    await expect(openExternal('https://example.com')).resolves.toBeUndefined();

    const unsubscribeMenuOpen = onMenuOpenFile(() => {});
    expect(typeof unsubscribeMenuOpen).toBe('function');
    unsubscribeMenuOpen();

    const unsubscribeMenuSave = onMenuSaveFile(() => {});
    expect(typeof unsubscribeMenuSave).toBe('function');
    unsubscribeMenuSave();

    const unsubscribeMenuCopy = onMenuCopyTranscription(() => {});
    expect(typeof unsubscribeMenuCopy).toBe('function');
    unsubscribeMenuCopy();

    const unsubscribeMenuStart = onMenuStartTranscription(() => {});
    expect(typeof unsubscribeMenuStart).toBe('function');
    unsubscribeMenuStart();

    const unsubscribeMenuCancel = onMenuCancelTranscription(() => {});
    expect(typeof unsubscribeMenuCancel).toBe('function');
    unsubscribeMenuCancel();

    const unsubscribeMenuHistory = onMenuToggleHistory(() => {});
    expect(typeof unsubscribeMenuHistory).toBe('function');
    unsubscribeMenuHistory();
  });

  it('delegates to underlying window.electronAPI when available', async () => {
    const api = createFullElectronAPIMock();
    window.electronAPI = api;

    await openFileDialog();
    expect(api.openFile).toHaveBeenCalled();

    await getFileInfo('/path/file.mp3');
    expect(api.getFileInfo).toHaveBeenCalledWith('/path/file.mp3');

    const testFile = new File([''], 'test.mp3');
    getPathForFile(testFile);
    expect(api.getPathForFile).toHaveBeenCalledWith(testFile);

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

    await checkFFmpeg();
    expect(api.checkFFmpeg).toHaveBeenCalled();

    await getAppInfo();
    expect(api.getAppInfo).toHaveBeenCalled();

    await getMemoryUsage();
    expect(api.getMemoryUsage).toHaveBeenCalled();

    await trackEvent('test_event', { prop: 'value' });
    expect(api.trackEvent).toHaveBeenCalledWith('test_event', { prop: 'value' });

    await checkForUpdates();
    expect(api.checkForUpdates).toHaveBeenCalled();

    await downloadUpdate();
    expect(api.downloadUpdate).toHaveBeenCalled();

    installUpdate();
    expect(api.installUpdate).toHaveBeenCalled();

    onUpdateStatus(() => {});
    expect(api.onUpdateStatus).toHaveBeenCalled();

    await openExternal('https://example.com');
    expect(api.openExternal).toHaveBeenCalledWith('https://example.com');

    onMenuOpenFile(() => {});
    expect(api.onMenuOpenFile).toHaveBeenCalled();

    onMenuSaveFile(() => {});
    expect(api.onMenuSaveFile).toHaveBeenCalled();

    onMenuCopyTranscription(() => {});
    expect(api.onMenuCopyTranscription).toHaveBeenCalled();

    onMenuStartTranscription(() => {});
    expect(api.onMenuStartTranscription).toHaveBeenCalled();

    onMenuCancelTranscription(() => {});
    expect(api.onMenuCancelTranscription).toHaveBeenCalled();

    onMenuToggleHistory(() => {});
    expect(api.onMenuToggleHistory).toHaveBeenCalled();
  });
});
