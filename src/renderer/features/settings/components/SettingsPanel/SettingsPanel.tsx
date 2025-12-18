import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Download, Check, Trash2, Zap, Cpu } from 'lucide-react';
import './SettingsPanel.css';

import type {
  TranscriptionSettings,
  ModelInfo,
  GpuInfo,
  ModelDownloadProgress,
  WhisperModelName,
  LanguageCode,
} from '../../../../types';
import { LANGUAGES, QUALITY_STARS } from '../../../../config';
import { DEFAULT_MODELS } from '../../services/modelService';
import {
  listModels,
  getGpuStatus,
  onModelDownloadProgress,
  downloadModel,
  deleteModel,
  logger,
} from '../../../../services';

export interface SettingsPanelProps {
  settings: TranscriptionSettings;
  onChange: (settings: TranscriptionSettings) => void;
  disabled: boolean;
  onModelStatusChange?: (downloaded: boolean) => void;
}

function SettingsPanel({
  settings,
  onChange,
  disabled,
  onModelStatusChange,
}: SettingsPanelProps): React.JSX.Element {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [gpuInfo, setGpuInfo] = useState<GpuInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress | null>(null);

  const loadModelInfo = async (): Promise<void> => {
    try {
      setLoading(true);
      const [modelList, gpu] = await Promise.all([listModels(), getGpuStatus()]);

      if (modelList?.models) {
        setModels(modelList.models);
      }
      if (gpu) {
        setGpuInfo(gpu);
      }
    } catch (err) {
      logger.error('Failed to load model info:', err);
      setModels(DEFAULT_MODELS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelInfo();

    const unsubscribe = onModelDownloadProgress((data: ModelDownloadProgress) => {
      setDownloadProgress(data);
      if (data.status === 'complete') {
        setDownloading(null);
        setDownloadProgress(null);
        loadModelInfo();
      } else if (data.status === 'error') {
        setDownloading(null);
        setDownloadProgress(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (models.length > 0 && onModelStatusChange) {
      const selectedModel = models.find((m) => m.name === settings.model);
      onModelStatusChange(selectedModel?.downloaded ?? false);
    }
  }, [models, settings.model, onModelStatusChange]);

  useEffect(() => {
    const lastModel = localStorage.getItem('whisperdesk_lastModel');
    if (lastModel && lastModel !== settings.model) {
      const validModels = models.map((m) => m.name);
      if (validModels.includes(lastModel)) {
        onChange({ ...settings, model: lastModel as WhisperModelName });
      }
    }
  }, [models, onChange, settings]);

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
      await downloadModel(modelName);
      await loadModelInfo();
    } catch (err) {
      logger.error('Failed to download model:', err);
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteModel = async (modelName: string): Promise<void> => {
    if (!window.confirm(`Are you sure you want to delete the ${modelName} model?`)) {
      return;
    }
    try {
      setLoading(true);
      const result = await deleteModel(modelName);
      if (!result?.success) {
        window.alert(`Failed to delete model: ${result?.error || 'Unknown error'}`);
        return;
      }
      await loadModelInfo();
    } catch (err) {
      logger.error('Failed to delete model:', err);
      window.alert(
        `Failed to delete model: ${err && typeof err === 'object' && 'message' in err ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModelChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    handleChange('model', e.target.value);
  };

  const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    handleChange('language', e.target.value);
  };

  const selectedModel = models.find((m) => m.name === settings.model);
  const trimmedRemainingTime = downloadProgress?.remainingTime?.trim() ?? '';

  return (
    <div className={`settings-panel ${disabled ? 'disabled' : ''}`}>
      <h3>Settings</h3>

      {gpuInfo && (
        <div
          className={`gpu-status ${gpuInfo.available ? 'gpu-available' : 'gpu-unavailable'}`}
          role="status"
          aria-live="polite"
          aria-label={`GPU acceleration: ${gpuInfo.available ? 'enabled' : 'disabled'}. Using ${gpuInfo.name}`}
        >
          <span className="gpu-icon" aria-hidden="true">
            {gpuInfo.available ? <Zap size={16} /> : <Cpu size={16} />}
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
                  <div className="download-progress">
                    <span className="downloading">
                      <span className="spinner"></span> Downloading...
                    </span>
                    {downloadProgress && downloadProgress.percent !== undefined && (
                      <span className="progress-text">
                        {downloadProgress.percent}%
                        {trimmedRemainingTime && ` (${trimmedRemainingTime} left)`}
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    className="btn-download"
                    onClick={() => handleDownloadModel(selectedModel.name)}
                    disabled={disabled}
                    aria-label={`Download ${selectedModel.name} model, size ${selectedModel.size}`}
                  >
                    <Download size={14} aria-hidden="true" /> Download {selectedModel.size}
                  </button>
                )}
              </div>
            )}

            {selectedModel.downloaded && (
              <div className="model-ready-container">
                <div className="model-ready">
                  <Check size={14} aria-hidden="true" /> Ready to use
                </div>
                <button
                  className="btn-delete-model"
                  onClick={() => handleDeleteModel(selectedModel.name)}
                  disabled={disabled || loading}
                  title="Delete model"
                  aria-label={`Delete ${selectedModel.name} model`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            )}
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

export { SettingsPanel };
