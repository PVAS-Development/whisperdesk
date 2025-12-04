import { ipcMain, dialog, app } from 'electron';
import type { BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  listModels,
  downloadModel,
  deleteModel,
  checkGpuStatus,
  transcribe,
} from '../services/whisper';
import {
  generateWordDocument,
  generatePdfDocument,
  generateMarkdownDocument,
} from '../utils/export-helper';
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

  ipcMain.handle('models:download', async (_event, modelName: string) => {
    try {
      return await downloadModel(modelName, (progress) => {
        getMainWindow()?.webContents.send('models:downloadProgress', progress);
      });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  });

  ipcMain.handle('models:delete', async (_event, modelName: string) => {
    return deleteModel(modelName);
  });

  let currentTranscription: { cancel?: () => void } | null = null;

  ipcMain.handle('transcribe:start', async (_event, options: TranscriptionOptions) => {
    try {
      const promise = transcribe(options, (progress) => {
        getMainWindow()?.webContents.send('transcribe:progress', progress);
      });

      currentTranscription = promise;
      const result = await promise;
      currentTranscription = null;

      return result;
    } catch (error) {
      currentTranscription = null;
      return { success: false, error: error instanceof Error ? error.message : String(error) };
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
}
