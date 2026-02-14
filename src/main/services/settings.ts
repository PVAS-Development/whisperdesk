import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { AppSettings, HoldToTranscribeSettings, TranslationConfig } from '../../shared/types';
import { UiohookKey } from 'uiohook-napi';

const DEFAULT_TRANSLATION_CONFIG: TranslationConfig = {
  enabled: false,
  provider: 'google',
  targetLanguage: 'English',
  apiKey: '',
  customEndpoint: '',
  customModel: '',
  systemPrompt: '',
};

const DEFAULT_HTT_SETTINGS: HoldToTranscribeSettings = {
  enabled: true,
  shortcutMode: 'hold',
  shortcutKeyCode: UiohookKey.AltRight,
  model: 'base',
  language: 'auto',
  autoPaste: true,
  audioDeviceId: '',
  translateToEnglish: false,
  translation: DEFAULT_TRANSLATION_CONFIG,
};

const DEFAULT_SETTINGS: AppSettings = {
  holdToTranscribe: DEFAULT_HTT_SETTINGS,
};

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export function loadSettings(): AppSettings {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8');
      const parsed = JSON.parse(data) as Partial<AppSettings>;
      const htt = parsed.holdToTranscribe;
      return {
        holdToTranscribe: {
          ...DEFAULT_HTT_SETTINGS,
          ...htt,
          translation: {
            ...DEFAULT_TRANSLATION_CONFIG,
            ...htt?.translation,
          },
        },
      };
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AppSettings): void {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
