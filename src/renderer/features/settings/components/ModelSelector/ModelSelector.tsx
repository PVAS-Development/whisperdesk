import React, { type ChangeEvent } from 'react';
import './ModelSelector.css';
import type { ModelInfo, WhisperModelName } from '../../../../types';

export interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: WhisperModelName;
  disabled: boolean;
  loading: boolean;
  onChange: (model: WhisperModelName) => void;
  ariaDescribedBy?: string;
}

function ModelSelector({
  models,
  selectedModel,
  disabled,
  loading,
  onChange,
  ariaDescribedBy,
}: ModelSelectorProps): React.JSX.Element {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    onChange(e.target.value as WhisperModelName);
  };

  return (
    <div className="setting-group">
      <label htmlFor="model-select">Model</label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={handleChange}
        disabled={disabled || loading}
        aria-label="Select Whisper model"
        aria-describedby={ariaDescribedBy}
      >
        {models.map((model) => (
          <option key={model.name} value={model.name}>
            {model.name.charAt(0).toUpperCase() + model.name.slice(1)} ({model.size})
            {model.downloaded ? ' ✓' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export { ModelSelector };
