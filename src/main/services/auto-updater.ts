import { autoUpdater } from 'electron-updater';
import type { BrowserWindow } from 'electron';
import type { UpdateInfo, UpdateProgress } from '../../shared/types';
import { trackEvent, AnalyticsEvents } from './analytics';
import log from 'electron-log';

autoUpdater.logger = log;

if (autoUpdater.logger) {
  (autoUpdater.logger as typeof log).transports.file.level = 'info';
}

const MAX_ERROR_MESSAGE_LENGTH = 100;

let updateCheckInProgress = false;

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  log.info('Auto-updater initialized');

  autoUpdater.on('checking-for-update', () => {
    updateCheckInProgress = true;
    log.info('Checking for updates...');
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send('update:status', {
      status: 'checking',
    });
    trackEvent(AnalyticsEvents.UPDATE_CHECKING);
  });

  autoUpdater.on('update-available', (info) => {
    updateCheckInProgress = false;
    log.info('Update available:', info.version);
    const mainWindow = getMainWindow();
    const updateInfo: UpdateInfo = {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes as string | undefined,
    };
    mainWindow?.webContents.send('update:status', {
      status: 'available',
      info: updateInfo,
    });
    trackEvent(AnalyticsEvents.UPDATE_AVAILABLE, { version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    updateCheckInProgress = false;
    log.info('No updates available');
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send('update:status', {
      status: 'not-available',
    });
    trackEvent(AnalyticsEvents.UPDATE_NOT_AVAILABLE);
  });

  autoUpdater.on('error', (error) => {
    updateCheckInProgress = false;
    log.error('Update error:', error);
    const mainWindow = getMainWindow();
    mainWindow?.webContents.send('update:status', {
      status: 'error',
      error: error.message,
    });
    trackEvent(AnalyticsEvents.UPDATE_ERROR, {
      error: (error.message ?? 'Unknown error').substring(0, MAX_ERROR_MESSAGE_LENGTH),
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const mainWindow = getMainWindow();
    const progress: UpdateProgress = {
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    };
    mainWindow?.webContents.send('update:status', {
      status: 'downloading',
      progress,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    const mainWindow = getMainWindow();
    const updateInfo: UpdateInfo = {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes as string | undefined,
    };
    mainWindow?.webContents.send('update:status', {
      status: 'downloaded',
      info: updateInfo,
    });
    trackEvent(AnalyticsEvents.UPDATE_DOWNLOADED, { version: info.version });
  });
}

export async function checkForUpdates(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (updateCheckInProgress) {
    log.info('Update check already in progress, skipping...');
    return { success: false, error: 'Update check already in progress' };
  }

  updateCheckInProgress = true;

  try {
    log.info('Manually checking for updates...');
    const result = await autoUpdater.checkForUpdates();
    log.info('Check for updates result:', result);
    return { success: true };
  } catch (error) {
    log.error('Error checking for updates:', error);
    updateCheckInProgress = false;
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check for updates',
    };
  }
}

export async function downloadUpdate(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download update',
    };
  }
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall();
}
