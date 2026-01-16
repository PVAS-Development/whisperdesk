import React from 'react';
import { Select } from '../../../../components/ui';
import type { SelectOption } from '../../../../components/ui';
import type { LanguageCode } from '../../../../types';
import { LANGUAGES } from '../../../../config';

export interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  disabled: boolean;
  onChange: (language: LanguageCode) => void;
}

function LanguageSelector({
  selectedLanguage,
  disabled,
  onChange,
}: LanguageSelectorProps): React.JSX.Element {
  const options: SelectOption[] = LANGUAGES.map((lang) => ({
    value: lang.value,
    label: lang.label,
  }));

  return (
    <Select
      id="language-select"
      label="Language"
      value={selectedLanguage}
      options={options}
      onChange={(value) => onChange(value as LanguageCode)}
      disabled={disabled}
      ariaLabel="Select transcription language"
    />
  );
}

export { LanguageSelector };
