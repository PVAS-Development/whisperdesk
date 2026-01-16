import React from 'react';
import { Select } from '../../../../components/ui';
import type { SelectOption } from '../../../../components/ui';
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
  const options: SelectOption[] = models.map((model) => ({
    value: model.name,
    label: `${model.name.charAt(0).toUpperCase() + model.name.slice(1)} (${model.size})${model.downloaded ? ' ✓' : ''}`,
  }));

  return (
    <Select
      id="model-select"
      label="Model"
      value={selectedModel}
      options={options}
      onChange={(value) => onChange(value as WhisperModelName)}
      disabled={disabled || loading}
      ariaLabel="Select Whisper model"
      ariaDescribedBy={ariaDescribedBy}
    />
  );
}

export { ModelSelector };
