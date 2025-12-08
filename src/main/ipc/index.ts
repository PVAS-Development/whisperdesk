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
import { trackEvent, AnalyticsEvents } from '../services/analytics';
import type { TranscriptionOptions, SaveFileOptions } from '../../shared/types';

export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null) {
  ipcMain.handle('dialog:openFile', async () => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return null;

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        {
          name: 'Audio/Video',
          extensions: ['mp3', 'wav', 'm4a', 'mp4', 'mov', 'mkv', 'flac', 'ogg', 'webm'],
        },
      ],
    });
    if (canceled) {
      return null;
    }
    return filePaths[0];
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
      const stats = fs.statSync(filePath);
      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
      };
    } catch {
      return null;
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
        getMainWindow()?.webContents.send('models:downloadProgress', progress);
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
        getMainWindow()?.webContents.send('transcribe:progress', progress);
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
}
