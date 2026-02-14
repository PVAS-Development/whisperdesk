import { clipboard, systemPreferences } from 'electron';
import type { BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { GlobalShortcutService } from './global-shortcut';
import { transcribe, isModelDownloaded } from './whisper';
import { cleanupTempAudio, saveTempAudio } from './audio-recorder';
import { loadSettings } from './settings';
import { updateTrayTooltip } from './tray';
import { trackEvent, AnalyticsEvents } from './analytics';
import { OverlayWindow } from './overlay';
import type { TranscriptionOptions } from '../../shared/types';

export class HoldToTranscribeService {
  private shortcutService: GlobalShortcutService;
  private getMainWindow: () => BrowserWindow | null;
  private overlay: OverlayWindow;
  private isRecording = false;
  private isTranscribing = false;

  constructor(getMainWindow: () => BrowserWindow | null) {
    this.getMainWindow = getMainWindow;
    this.shortcutService = new GlobalShortcutService();
    this.overlay = new OverlayWindow();

    this.shortcutService.on('shortcut-hold-start', () => this.onHoldStart());
    this.shortcutService.on('shortcut-hold-end', () => this.onHoldEnd());
  }

  initialize(): void {
    const settings = loadSettings();
    if (!settings.holdToTranscribe.enabled) return;

    this.overlay.create();

    if (settings.holdToTranscribe.shortcutMode === 'hold') {
      const isTrusted = systemPreferences.isTrustedAccessibilityClient(false);
      if (!isTrusted) {
        const win = this.getMainWindow();
        win?.webContents.once('did-finish-load', () => {
          win?.webContents.send('htt:accessibilityRequired');
        });
        // Fall back to toggle mode
        const fallbackSettings = {
          ...settings,
          holdToTranscribe: { ...settings.holdToTranscribe, shortcutMode: 'toggle' as const },
        };
        this.shortcutService.setShortcut(
          fallbackSettings.holdToTranscribe.shortcutKeyCode,
          'toggle'
        );
        this.shortcutService.start();
        updateTrayTooltip('Ready (toggle mode)');
        return;
      }
    }

    this.shortcutService.setShortcut(
      settings.holdToTranscribe.shortcutKeyCode,
      settings.holdToTranscribe.shortcutMode
    );
    this.shortcutService.start();
    updateTrayTooltip('Ready');
  }

  private onHoldStart(): void {
    if (this.isRecording || this.isTranscribing) return;

    const settings = loadSettings();
    if (!isModelDownloaded(settings.holdToTranscribe.model)) {
      const model = settings.holdToTranscribe.model;
      const win = this.getMainWindow();
      win?.webContents.send('htt:modelNotDownloaded', { model });
      updateTrayTooltip(`Model "${model}" not downloaded`);
      this.overlay.updateState({
        status: 'error',
        message: `Model "${model}" not downloaded`,
      });
      return;
    }

    this.isRecording = true;
    updateTrayTooltip('Recording...');
    this.overlay.updateState({ status: 'recording', message: 'Recording...' });
    trackEvent(AnalyticsEvents.HTT_RECORDING_STARTED);

    const win = this.getMainWindow();
    win?.webContents.send('htt:startRecording');
  }

  private onHoldEnd(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    const processingSettings = loadSettings();
    const translateMsg = processingSettings.holdToTranscribe.translateToEnglish
      ? 'Translating to English...'
      : 'Transcribing...';
    updateTrayTooltip('Processing...');
    this.overlay.updateState({ status: 'processing', message: translateMsg });
    trackEvent(AnalyticsEvents.HTT_RECORDING_STOPPED);

    const win = this.getMainWindow();
    win?.webContents.send('htt:stopRecording');
  }

  async handleAudioBuffer(buffer: ArrayBuffer): Promise<void> {
    if (this.isTranscribing) return;
    this.isTranscribing = true;

    const tempPath = saveTempAudio(Buffer.from(buffer));

    try {
      const settings = loadSettings();
      const options: TranscriptionOptions = {
        filePath: tempPath,
        model: settings.holdToTranscribe.model,
        language: settings.holdToTranscribe.language,
        outputFormat: 'txt',
        translate: settings.holdToTranscribe.translateToEnglish,
      };

      const result = await transcribe(options);
      const win = this.getMainWindow();

      if (result.success && result.text) {
        const text = result.text.trim();
        clipboard.writeText(text);

        if (settings.holdToTranscribe.autoPaste) {
          // Small delay to ensure clipboard is updated
          await new Promise((resolve) => setTimeout(resolve, 50));
          await this.simulatePaste();
          trackEvent(AnalyticsEvents.HTT_AUTO_PASTE);
        }

        win?.webContents.send('htt:transcriptionResult', { text });
        trackEvent(AnalyticsEvents.HTT_TRANSCRIPTION_COMPLETED);
        updateTrayTooltip('Ready');
        this.overlay.updateState({ status: 'success', message: 'Pasted' });
      } else {
        const error = result.error || 'Transcription failed';
        win?.webContents.send('htt:transcriptionResult', { text: '', error });
        trackEvent(AnalyticsEvents.HTT_TRANSCRIPTION_FAILED, { error: error.substring(0, 100) });
        updateTrayTooltip('Ready');
        this.overlay.updateState({ status: 'error', message: error });
      }
    } catch (err) {
      console.error('HTT transcription error:', err);
      const win = this.getMainWindow();
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      win?.webContents.send('htt:transcriptionResult', {
        text: '',
        error: errorMsg,
      });
      updateTrayTooltip('Ready');
      this.overlay.updateState({ status: 'error', message: errorMsg });
    } finally {
      this.isTranscribing = false;
      cleanupTempAudio(tempPath);
    }
  }

  private simulatePaste(): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(
        'osascript -e \'tell application "System Events" to keystroke "v" using command down\'',
        (error) => {
          if (error) {
            console.error('Failed to simulate paste:', error);
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  reloadSettings(): void {
    this.shortcutService.stop();
    this.overlay.destroy();
    this.initialize();
  }

  requestAccessibility(): void {
    systemPreferences.isTrustedAccessibilityClient(true);
  }

  destroy(): void {
    this.shortcutService.stop();
    this.overlay.destroy();
  }
}
