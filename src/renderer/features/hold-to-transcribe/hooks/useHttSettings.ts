import { useState, useEffect, useCallback } from 'react';
import type {
  HoldToTranscribeSettings,
  ModelInfo,
  WhisperModelName,
  LanguageCode,
  ShortcutMode,
} from '../../../types';
import { listModels } from '../../../services';

const DEFAULT_SETTINGS: HoldToTranscribeSettings = {
  enabled: true,
  shortcutMode: 'hold',
  shortcutKeyCode: 3640, // UiohookKey.AltRight
  model: 'base',
  language: 'auto',
  autoPaste: true,
};

export interface UseHttSettingsReturn {
  settings: HoldToTranscribeSettings;
  loading: boolean;
  models: ModelInfo[];
  updateEnabled: (enabled: boolean) => void;
  updateShortcutMode: (mode: ShortcutMode) => void;
  updateModel: (model: WhisperModelName) => void;
  updateLanguage: (language: LanguageCode) => void;
  updateAutoPaste: (autoPaste: boolean) => void;
}

export function useHttSettings(): UseHttSettingsReturn {
  const [settings, setSettings] = useState<HoldToTranscribeSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    Promise.all([
      window.electronAPI?.loadSettings(),
      listModels().catch(() => ({ models: [] })),
    ]).then(([appSettings, modelResult]) => {
      if (appSettings?.holdToTranscribe) {
        setSettings(appSettings.holdToTranscribe);
      }
      if (modelResult?.models) {
        setModels(modelResult.models);
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((updated: HoldToTranscribeSettings) => {
    setSettings(updated);
    window.electronAPI?.saveSettings({ holdToTranscribe: updated }).then(() => {
      window.electronAPI?.httUpdateSettings();
    });
  }, []);

  const updateEnabled = useCallback(
    (enabled: boolean) => save({ ...settings, enabled }),
    [settings, save]
  );

  const updateShortcutMode = useCallback(
    (shortcutMode: ShortcutMode) => save({ ...settings, shortcutMode }),
    [settings, save]
  );

  const updateModel = useCallback(
    (model: WhisperModelName) => save({ ...settings, model }),
    [settings, save]
  );

  const updateLanguage = useCallback(
    (language: LanguageCode) => save({ ...settings, language }),
    [settings, save]
  );

  const updateAutoPaste = useCallback(
    (autoPaste: boolean) => save({ ...settings, autoPaste }),
    [settings, save]
  );

  return {
    settings,
    loading,
    models,
    updateEnabled,
    updateShortcutMode,
    updateModel,
    updateLanguage,
    updateAutoPaste,
  };
}
