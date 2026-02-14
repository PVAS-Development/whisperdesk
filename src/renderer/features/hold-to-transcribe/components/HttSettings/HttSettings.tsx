import React from 'react';
import type { ChangeEvent } from 'react';
import { useHttSettings } from '../../hooks/useHttSettings';
import type { WhisperModelName, LanguageCode, ShortcutMode } from '../../../../types';
import { TRANSLATE_INCOMPATIBLE_MODELS } from '../../../../types';
import { LANGUAGES } from '../../../../config';
import './HttSettings.css';

const SHORTCUT_MODES: { value: ShortcutMode; label: string }[] = [
  { value: 'hold', label: 'Hold to record' },
  { value: 'toggle', label: 'Toggle (press twice)' },
];

function HttSettings(): React.JSX.Element {
  const {
    settings,
    loading,
    models,
    devices,
    updateEnabled,
    updateShortcutMode,
    updateModel,
    updateLanguage,
    updateAutoPaste,
    updateAudioDevice,
    updateTranslateToEnglish,
  } = useHttSettings();

  const selectedModelInfo = models.find((m) => m.name === settings.model);
  const isModelDownloaded = selectedModelInfo?.downloaded ?? false;

  if (loading) {
    return (
      <div className="htt-settings">
        <h4>Hold-to-Transcribe</h4>
        <p className="htt-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="htt-settings">
      <h4>Hold-to-Transcribe</h4>

      <div className="setting-group">
        <label className="htt-toggle-label">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateEnabled(e.target.checked)}
          />
          <span>Enabled</span>
        </label>
      </div>

      {settings.enabled && (
        <>
          <div className="setting-group">
            <label htmlFor="htt-mode-select">Shortcut Mode</label>
            <select
              id="htt-mode-select"
              value={settings.shortcutMode}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                updateShortcutMode(e.target.value as ShortcutMode)
              }
            >
              {SHORTCUT_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </select>
            {settings.shortcutMode === 'hold' && (
              <p className="htt-hint">
                Hold <kbd>Right Option</kbd> to record. Requires Accessibility permission.
              </p>
            )}
            {settings.shortcutMode === 'toggle' && (
              <p className="htt-hint">
                Press <kbd>Alt+Right</kbd> to start/stop recording.
              </p>
            )}
          </div>

          <div className="setting-group">
            <label htmlFor="htt-model-select">Model</label>
            <select
              id="htt-model-select"
              value={settings.model}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                updateModel(e.target.value as WhisperModelName)
              }
            >
              {models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name.charAt(0).toUpperCase() + model.name.slice(1)} ({model.size})
                  {model.downloaded ? ' \u2713' : ''}
                </option>
              ))}
            </select>
            {!isModelDownloaded && settings.model && (
              <p className="htt-model-warning">
                Model &quot;{settings.model}&quot; is not downloaded. Use the Model section above to
                download it.
              </p>
            )}
          </div>

          <div className="setting-group">
            <label htmlFor="htt-language-select">Language</label>
            <select
              id="htt-language-select"
              value={settings.language}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                updateLanguage(e.target.value as LanguageCode)
              }
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label className="htt-toggle-label">
              <input
                type="checkbox"
                checked={settings.autoPaste}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateAutoPaste(e.target.checked)}
              />
              <span>Auto-paste into focused input</span>
            </label>
          </div>

          <div className="setting-group">
            <label htmlFor="htt-device-select">Audio Input Device</label>
            <select
              id="htt-device-select"
              value={settings.audioDeviceId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateAudioDevice(e.target.value)}
            >
              <option value="">System Default</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label className="htt-toggle-label">
              <input
                type="checkbox"
                checked={settings.translateToEnglish}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  updateTranslateToEnglish(e.target.checked)
                }
              />
              <span>Translate to English</span>
            </label>
            <p className="htt-hint">Translates speech in any language to English text.</p>
            {settings.translateToEnglish &&
              TRANSLATE_INCOMPATIBLE_MODELS.includes(settings.model) && (
                <p className="htt-model-warning">
                  Translation is not supported with the &quot;{settings.model}&quot; model. Use a
                  multilingual model (e.g., base, small, medium, large-v3).
                </p>
              )}
          </div>
        </>
      )}
    </div>
  );
}

export { HttSettings };
