import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

import type {
  TranscriptionSettings,
  ModelInfo,
  GpuInfo,
  ModelDownloadProgress,
  WhisperModelName,
  LanguageCode,
} from '../../../../types';
import { DEFAULT_MODELS } from '../../services/modelService';
import {
  listModels,
  getGpuStatus,
  onModelDownloadProgress,
  downloadModel,
  deleteModel,
  logger,
} from '../../../../services';

import { GpuStatus } from '../GpuStatus';
import { ModelSelector } from '../ModelSelector';
import { ModelDetails } from '../ModelDetails';
import { LanguageSelector } from '../LanguageSelector';

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

  const handleModelChange = (model: WhisperModelName): void => {
    onChange({ ...settings, model });
    localStorage.setItem('whisperdesk_lastModel', model);
  };

  const handleLanguageChange = (language: LanguageCode): void => {
    onChange({ ...settings, language });
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

  const selectedModelInfo = models.find((m) => m.name === settings.model);

  return (
    <div className={`settings-panel ${disabled ? 'disabled' : ''}`}>
      <h3>Settings</h3>

      <GpuStatus gpuInfo={gpuInfo} />

      <ModelSelector
        models={models}
        selectedModel={settings.model}
        disabled={disabled}
        loading={loading}
        onChange={handleModelChange}
        ariaDescribedBy={selectedModelInfo ? 'model-details' : undefined}
      />

      <ModelDetails
        model={selectedModelInfo}
        downloading={downloading}
        downloadProgress={downloadProgress}
        disabled={disabled || loading}
        onDownload={handleDownloadModel}
        onDelete={handleDeleteModel}
      />

      <LanguageSelector
        selectedLanguage={settings.language}
        disabled={disabled}
        onChange={handleLanguageChange}
      />
    </div>
  );
}

export { SettingsPanel };
