import React from 'react';
import type { ChangeEvent } from 'react';
import { useHttSettings } from '../../hooks/useHttSettings';
import type { WhisperModelName, LanguageCode, ShortcutMode } from '../../../../types';
import { LANGUAGES } from '../../../../config';
import './HttSettings.css';

const SHORTCUT_MODES: { value: ShortcutMode; label: string }[] = [
  { value: 'hold', label: 'Hold to record' },
  { value: 'toggle', label: 'Toggle (press twice)' },
];

const HTT_MODELS: { value: WhisperModelName; label: string }[] = [
  { value: 'tiny', label: 'Tiny (fastest)' },
  { value: 'tiny.en', label: 'Tiny English' },
  { value: 'base', label: 'Base (recommended)' },
  { value: 'base.en', label: 'Base English' },
  { value: 'small', label: 'Small' },
  { value: 'small.en', label: 'Small English' },
  { value: 'medium', label: 'Medium' },
  { value: 'large-v3-turbo', label: 'Large Turbo (best)' },
];

function HttSettings(): React.JSX.Element {
  const {
    settings,
    loading,
    updateEnabled,
    updateShortcutMode,
    updateModel,
    updateLanguage,
    updateAutoPaste,
  } = useHttSettings();

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
              {HTT_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
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
        </>
      )}
    </div>
  );
}

export { HttSettings };
