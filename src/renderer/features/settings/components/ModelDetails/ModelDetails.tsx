import React from 'react';
import { Download, Check, Trash2 } from 'lucide-react';
import './ModelDetails.css';
import type { ModelInfo, ModelDownloadProgress } from '../../../../types';
import { QUALITY_STARS } from '../../../../config';

export interface ModelDetailsProps {
  model: ModelInfo | undefined;
  downloading: string | null;
  downloadProgress: ModelDownloadProgress | null;
  disabled: boolean;
  onDownload: (modelName: string) => void;
  onDelete: (modelName: string) => void;
}

function ModelDetails({
  model,
  downloading,
  downloadProgress,
  disabled,
  onDownload,
  onDelete,
}: ModelDetailsProps): React.JSX.Element | null {
  if (!model) return null;

  const trimmedRemainingTime = downloadProgress?.remainingTime?.trim() ?? '';

  return (
    <div className="model-details" id="model-details" role="status" aria-live="polite">
      <div className="model-info-row">
        <span className="model-stat">
          <span className="stat-label">Speed:</span>
          <span className="stat-value">{model.speed}</span>
        </span>
        <span className="model-stat">
          <span className="stat-label">Quality:</span>
          <span className="stat-value quality">{QUALITY_STARS[model.quality - 1]}</span>
        </span>
      </div>

      {!model.downloaded && (
        <div className="model-download">
          {downloading === model.name ? (
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
              onClick={() => onDownload(model.name)}
              disabled={disabled}
              aria-label={`Download ${model.name} model, size ${model.size}`}
            >
              <Download size={14} aria-hidden="true" /> Download {model.size}
            </button>
          )}
        </div>
      )}

      {model.downloaded && (
        <div className="model-ready-container">
          <div className="model-ready">
            <Check size={14} aria-hidden="true" /> Ready to use
          </div>
          <button
            className="btn-delete-model"
            onClick={() => onDelete(model.name)}
            disabled={disabled}
            title="Delete model"
            aria-label={`Delete ${model.name} model`}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export { ModelDetails };
