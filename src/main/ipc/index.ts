import { ipcMain, dialog, app, shell } from 'electron';
import type { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  listModels,
  downloadModel,
  deleteModel,
  checkGpuStatus,
  checkFFmpeg,
  transcribe,
} from '../services/whisper';
import { checkForUpdates, downloadUpdate, quitAndInstall } from '../services/auto-updater';
import {
  generateWordDocument,
  generatePdfDocument,
  generateMarkdownDocument,
} from '../utils/export-helper';
import { generateFileFingerprint } from '../utils/media-info';
import { createMediaProtocolUrl } from '../utils/media-protocol';
import { safeSend } from '../utils/safe-send';
import { trackEvent, AnalyticsEvents } from '../services/analytics';
import { SUPPORTED_EXTENSIONS, VIDEO_EXTENSIONS } from '../../shared/types';
import type { TranscriptionOptions, SaveFileOptions, SupportedExtension } from '../../shared/types';

const OPEN_DIALOG_MEDIA_EXTENSIONS = [...SUPPORTED_EXTENSIONS];
const VIDEO_EXTENSION_SET = new Set<string>(VIDEO_EXTENSIONS);

function getSupportedMediaExtension(filePath: string): SupportedExtension | null {
  const extension = path.extname(filePath).replace('.', '').toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)
    ? (extension as SupportedExtension)
    : null;
}

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle('dialog:openFile', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        {
          name: 'Audio/Video',
          extensions: OPEN_DIALOG_MEDIA_EXTENSIONS,
        },
      ],
    });
    if (canceled) {
      return null;
    }
    return filePaths[0];
  });

  ipcMain.handle('dialog:openMultipleFiles', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        {
          name: 'Audio/Video',
          extensions: OPEN_DIALOG_MEDIA_EXTENSIONS,
        },
      ],
    });
    return canceled ? null : filePaths;
  });

  ipcMain.handle('dialog:saveFile', async (_event, options: SaveFileOptions) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return { success: false, error: 'No window available' };

    const { defaultName, content, format } = options;

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: format.toUpperCase(), extensions: [format] }],
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    try {
      let data: string | Buffer = content;

      if (format === 'docx') {
        data = await generateWordDocument(content, { fileName: path.basename(filePath) });
      } else if (format === 'pdf') {
        data = await generatePdfDocument(content, { fileName: path.basename(filePath) });
      } else if (format === 'md') {
        data = generateMarkdownDocument(content, { fileName: path.basename(filePath) });
      }

      fs.writeFileSync(filePath, data);
      trackEvent(AnalyticsEvents.EXPORT_SAVED, { format });
      return { success: true, filePath };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('file:getInfo', async (_event, filePath: string) => {
    try {
      const stats = await fs.promises.stat(filePath);
      let fingerprint: string | undefined;
      try {
        fingerprint = await generateFileFingerprint(filePath, stats.size);
      } catch {
        fingerprint = undefined;
      }

      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        fingerprint,
      };
    } catch {
      return null;
    }
  });

  ipcMain.handle('file:getMediaSource', async (_event, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return { success: false, error: 'Invalid file path' };
      }

      if (!path.isAbsolute(filePath)) {
        return { success: false, error: 'Invalid file path' };
      }

      const normalizedPath = path.resolve(filePath);
      let resolvedPath: string;

      try {
        const linkStats = await fs.promises.lstat(normalizedPath);
        if (linkStats.isSymbolicLink()) {
          return { success: false, error: 'Unsupported media file' };
        }

        if (!linkStats.isFile()) {
          return { success: false, error: 'Unsupported media file' };
        }

        resolvedPath = await fs.promises.realpath(normalizedPath);
        const stats = await fs.promises.stat(resolvedPath);
        if (!stats.isFile()) {
          return { success: false, error: 'Unsupported media file' };
        }
      } catch {
        return { success: false, error: 'File not found' };
      }

      const extension = getSupportedMediaExtension(resolvedPath);
      if (!extension) {
        return { success: false, error: 'Unsupported media file' };
      }

      try {
        await fs.promises.access(resolvedPath, fs.constants.R_OK);
      } catch {
        return { success: false, error: 'File not found' };
      }

      return {
        success: true,
        url: createMediaProtocolUrl(resolvedPath),
        mediaType: VIDEO_EXTENSION_SET.has(extension) ? 'video' : 'audio',
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('models:list', async () => {
    const models = listModels();
    return { models };
  });

  ipcMain.handle('models:gpuStatus', () => checkGpuStatus());

  ipcMain.handle('system:checkFFmpeg', () => checkFFmpeg());

  ipcMain.handle('models:download', async (_event, modelName: string) => {
    try {
      const result = await downloadModel(modelName, (progress) => {
        safeSend(getMainWindow(), 'models:downloadProgress', progress);
      });
      if (result.success) {
        trackEvent(AnalyticsEvents.MODEL_DOWNLOADED, { model: modelName });
      }
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('models:delete', (_event, modelName: string) => {
    const result = deleteModel(modelName);
    if (result.success) {
      trackEvent(AnalyticsEvents.MODEL_DELETED, { model: modelName });
    }
    return result;
  });

  let currentTranscription: { cancel?: () => void } | null = null;

  ipcMain.handle('transcribe:start', async (_event, options: TranscriptionOptions) => {
    try {
      const promise = transcribe(options, (progress) => {
        safeSend(getMainWindow(), 'transcribe:progress', progress);
      });

      currentTranscription = promise;

      trackEvent(AnalyticsEvents.TRANSCRIPTION_STARTED, {
        model: options.model,
        language: options.language,
      });

      const result = await promise;
      currentTranscription = null;

      if (result.success && !result.cancelled) {
        trackEvent(AnalyticsEvents.TRANSCRIPTION_COMPLETED, {
          model: options.model,
          language: options.language,
        });
      } else if (result.cancelled) {
        trackEvent(AnalyticsEvents.TRANSCRIPTION_CANCELLED);
      }

      return result;
    } catch (error) {
      currentTranscription = null;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const sanitizedError = errorMessage
        .replace(/\/[^\s]+/g, '[path]')
        .replace(/[A-Za-z]:[\\/][^\s]+/g, '[path]')
        .substring(0, 100);
      trackEvent(AnalyticsEvents.TRANSCRIPTION_FAILED, {
        model: options.model,
        error: sanitizedError,
      });
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('transcribe:cancel', () => {
    if (currentTranscription && currentTranscription.cancel) {
      currentTranscription.cancel();
      currentTranscription = null;
      return { success: true };
    }
    return { success: false, message: 'No active transcription' };
  });

  ipcMain.handle('app:getInfo', () => {
    return {
      isDev: !app.isPackaged,
      version: app.getVersion(),
      platform: process.platform,
      osVersion: process.getSystemVersion(),
    };
  });

  ipcMain.handle('app:getMemoryUsage', () => {
    const memory = process.memoryUsage();
    return {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      rss: memory.rss,
      external: memory.external,
      isTranscribing: !!currentTranscription,
    };
  });

  ipcMain.handle(
    'analytics:track',
    (_event, eventName: string, properties?: Record<string, string | number | boolean>) => {
      trackEvent(eventName, properties);
    }
  );

  ipcMain.handle('update:check', () => checkForUpdates());

  ipcMain.handle('update:download', () => downloadUpdate());

  ipcMain.handle('update:install', () => {
    trackEvent(AnalyticsEvents.UPDATE_INSTALLED);
    quitAndInstall();
  });

  ipcMain.handle('shell:openExternal', async (_event, url: string) => {
    if (!url.startsWith('https://')) {
      throw new Error('Invalid URL protocol. Only HTTPS is allowed.');
    }
    await shell.openExternal(url);
  });

  ipcMain.handle('shell:showItemInFolder', async (_event, filePath: string) => {
    try {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return { success: false, error: 'Invalid file path' };
      }

      if (!path.isAbsolute(filePath)) {
        return { success: false, error: 'Invalid file path' };
      }

      const resolvedPath = path.resolve(filePath);

      try {
        await fs.promises.access(resolvedPath, fs.constants.F_OK);
      } catch {
        return { success: false, error: 'File not found' };
      }

      shell.showItemInFolder(resolvedPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
}
