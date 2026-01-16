import React from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

function Select({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
}: SelectProps): React.JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    onChange(e.target.value);
  };

  return (
    <div className="select-group">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        aria-describedby={ariaDescribedBy}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { Select };
