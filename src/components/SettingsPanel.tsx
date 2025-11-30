import React, { useState, useEffect, type ChangeEvent } from 'react';
import './SettingsPanel.css';

import type {
  TranscriptionSettings,
  ModelInfo,
  GpuInfo,
  ModelDownloadProgress,
  WhisperModelName,
  LanguageCode,
} from '../types';
import { LANGUAGES, QUALITY_STARS } from '../types';

// =============================================================================
// Props Interface
// =============================================================================

interface SettingsPanelProps {
  /** Current settings */
  settings: TranscriptionSettings;
  /** Callback when settings change */
  onChange: (settings: TranscriptionSettings) => void;
  /** Whether the panel is disabled */
  disabled: boolean;
  /** Callback when model download status changes */
  onModelStatusChange?: (downloaded: boolean) => void;
}

// =============================================================================
// Default Models (fallback if API fails)
// =============================================================================

const DEFAULT_MODELS: ModelInfo[] = [
  { name: 'tiny', size: '39 MB', speed: '~32x', quality: 1, downloaded: false },
  { name: 'base', size: '74 MB', speed: '~16x', quality: 2, downloaded: false },
  { name: 'small', size: '244 MB', speed: '~6x', quality: 3, downloaded: false },
  { name: 'medium', size: '769 MB', speed: '~2x', quality: 4, downloaded: false },
  { name: 'large', size: '1.5 GB', speed: '~1x', quality: 5, downloaded: false },
];

// =============================================================================
// Component
// =============================================================================

function SettingsPanel({
  settings,
  onChange,
  disabled,
  onModelStatusChange,
}: SettingsPanelProps): React.JSX.Element {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [gpuInfo, setGpuInfo] = useState<GpuInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Load Model Info
  // -------------------------------------------------------------------------
  const loadModelInfo = async (): Promise<void> => {
    try {
      setLoading(true);
      const [modelList, gpu] = await Promise.all([
        window.electronAPI?.listModels(),
        window.electronAPI?.getGpuStatus(),
      ]);

      if (modelList?.models) {
        setModels(modelList.models);
      }
      if (gpu) {
        setGpuInfo(gpu);
      }
    } catch (err) {
      console.error('Failed to load model info:', err);
      setModels(DEFAULT_MODELS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelInfo();

    // Listen for download progress
    const unsubscribe = window.electronAPI?.onModelDownloadProgress?.(
      (data: ModelDownloadProgress) => {
        if (data.status === 'complete') {
          setDownloading(null);
          loadModelInfo();
        }
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Notify Parent of Model Status
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (models.length > 0 && onModelStatusChange) {
      const selectedModel = models.find((m) => m.name === settings.model);
      onModelStatusChange(selectedModel?.downloaded ?? false);
    }
  }, [models, settings.model, onModelStatusChange]);

  // -------------------------------------------------------------------------
  // Load Last Used Model on Mount
  // -------------------------------------------------------------------------
  useEffect(() => {
    const lastModel = localStorage.getItem('whisperdesk_lastModel');
    if (lastModel && lastModel !== settings.model) {
      // Validate that it's a valid model name
      const validModels = models.map((m) => m.name);
      if (validModels.includes(lastModel)) {
        onChange({ ...settings, model: lastModel as WhisperModelName });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models]); // Only run when models are loaded

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleChange = (key: keyof TranscriptionSettings, value: string): void => {
    if (key === 'model') {
      onChange({ ...settings, model: value as WhisperModelName });
      localStorage.setItem('whisperdesk_lastModel', value);
    } else if (key === 'language') {
      onChange({ ...settings, language: value as LanguageCode });
    }
  };

  const handleDownloadModel = async (modelName: string): Promise<void> => {
    try {
      setDownloading(modelName);
      await window.electronAPI?.downloadModel(modelName);
      await loadModelInfo();
    } catch (err) {
      console.error('Failed to download model:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleModelChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    handleChange('model', e.target.value);
  };

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    handleChange('language', e.target.value);
  };

  // -------------------------------------------------------------------------
  // Derived State
  // -------------------------------------------------------------------------
  const selectedModel = models.find((m) => m.name === settings.model);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className={`settings-panel ${disabled ? 'disabled' : ''}`}>
      <h3>Settings</h3>

      {/* GPU Status */}
      {gpuInfo && (
        <div
          className={`gpu-status ${gpuInfo.available ? 'gpu-available' : 'gpu-unavailable'}`}
          role="status"
          aria-live="polite"
          aria-label={`GPU acceleration: ${gpuInfo.available ? 'enabled' : 'disabled'}. Using ${gpuInfo.name}`}
        >
          <span className="gpu-icon" aria-hidden="true">
            {gpuInfo.available ? '🚀' : '💻'}
          </span>
          <span className="gpu-text">{gpuInfo.name}</span>
        </div>
      )}

      <div className="setting-group">
        <label htmlFor="model-select">Model</label>
        <select
          id="model-select"
          value={settings.model}
          onChange={handleModelChange}
          disabled={disabled || loading}
          aria-label="Select Whisper model"
          aria-describedby={selectedModel ? 'model-details' : undefined}
        >
          {models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name.charAt(0).toUpperCase() + model.name.slice(1)} ({model.size})
              {model.downloaded ? ' ✓' : ''}
            </option>
          ))}
        </select>

        {selectedModel && (
          <div className="model-details" id="model-details" role="status" aria-live="polite">
            <div className="model-info-row">
              <span className="model-stat">
                <span className="stat-label">Speed:</span>
                <span className="stat-value">{selectedModel.speed}</span>
              </span>
              <span className="model-stat">
                <span className="stat-label">Quality:</span>
                <span className="stat-value quality">
                  {QUALITY_STARS[selectedModel.quality - 1]}
                </span>
              </span>
            </div>

            {!selectedModel.downloaded && (
              <div className="model-download">
                {downloading === selectedModel.name ? (
                  <span className="downloading">
                    <span className="spinner"></span> Downloading...
                  </span>
                ) : (
                  <button
                    className="btn-download"
                    onClick={() => handleDownloadModel(selectedModel.name)}
                    disabled={disabled}
                    aria-label={`Download ${selectedModel.name} model, size ${selectedModel.size}`}
                  >
                    ⬇️ Download {selectedModel.size}
                  </button>
                )}
              </div>
            )}

            {selectedModel.downloaded && <span className="model-ready">✓ Ready to use</span>}
          </div>
        )}
      </div>

      <div className="setting-group">
        <label htmlFor="language-select">Language</label>
        <select
          id="language-select"
          value={settings.language}
          onChange={handleLanguageChange}
          disabled={disabled}
          aria-label="Select transcription language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SettingsPanel;
