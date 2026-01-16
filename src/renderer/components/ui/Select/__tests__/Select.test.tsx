import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../Select';
import type { SelectOption } from '../Select';

const mockOptions: SelectOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select', () => {
  it('renders with label', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option1"
        options={mockOptions}
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders all options', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option1"
        options={mockOptions}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option1"
        options={mockOptions}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'option2' },
    });

    expect(onChange).toHaveBeenCalledWith('option2');
  });

  it('is disabled when disabled prop is true', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option1"
        options={mockOptions}
        onChange={onChange}
        disabled
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('applies aria-label when provided', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option1"
        options={mockOptions}
        onChange={onChange}
        ariaLabel="Custom aria label"
      />
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Custom aria label');
  });

  it('uses label as aria-label when ariaLabel not provided', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option1"
        options={mockOptions}
        onChange={onChange}
      />
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Test Label');
  });

  it('applies aria-describedby when provided', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option1"
        options={mockOptions}
        onChange={onChange}
        ariaDescribedBy="description-element"
      />
    );

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'description-element');
  });

  it('shows correct selected value', () => {
    const onChange = vi.fn();

    render(
      <Select
        id="test-select"
        label="Test Label"
        value="option2"
        options={mockOptions}
        onChange={onChange}
      />
    );

    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('option2');
  });
});
