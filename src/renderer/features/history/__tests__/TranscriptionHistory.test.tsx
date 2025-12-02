import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranscriptionHistory } from '@/features/history';
import { createMockHistoryItem } from '@/test/fixtures';

describe('TranscriptionHistory component', () => {
  it('renders empty state when no history', () => {
    const onClear = vi.fn();
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TranscriptionHistory
        history={[]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText(/No transcriptions yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Clear All/i)).not.toBeInTheDocument();
  });

  it('renders history items and calls onSelect on click', () => {
    const mockHistoryItem = createMockHistoryItem();
    const onClear = vi.fn();
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TranscriptionHistory
        history={[mockHistoryItem]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText(/Transcription History/i)).toBeInTheDocument();
    expect(screen.getByText('test.mp3')).toBeInTheDocument();

    const item = screen.getByText('test.mp3').closest('.history-item') as HTMLElement;
    fireEvent.click(item);

    expect(onSelect).toHaveBeenCalledWith(mockHistoryItem);
  });

  it('calls onSelect on Enter key press', () => {
    const mockHistoryItem = createMockHistoryItem();
    const onClear = vi.fn();
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TranscriptionHistory
        history={[mockHistoryItem]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    const item = screen.getByText('test.mp3').closest('.history-item') as HTMLElement;
    item.focus();
    fireEvent.keyDown(item, { key: 'Enter', code: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith(mockHistoryItem);
  });

  it('shows clear button only when history is not empty and handles actions', () => {
    const mockHistoryItem = createMockHistoryItem();
    const onClear = vi.fn();
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TranscriptionHistory
        history={[mockHistoryItem]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    const clearButton = screen.getByText(/Clear All/i);
    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalled();

    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked without selecting item', () => {
    const mockHistoryItem = createMockHistoryItem();
    const onClear = vi.fn();
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TranscriptionHistory
        history={[mockHistoryItem]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByLabelText(`Delete ${mockHistoryItem.fileName}`);
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockHistoryItem.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not call onSelect on non-Enter key press', () => {
    const mockHistoryItem = createMockHistoryItem();
    const onClear = vi.fn();
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TranscriptionHistory
        history={[mockHistoryItem]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    const item = screen.getByText('test.mp3').closest('.history-item') as HTMLElement;
    item.focus();
    fireEvent.keyDown(item, { key: 'Space', code: 'Space' });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('displays all item metadata correctly', () => {
    const mockHistoryItem = createMockHistoryItem({
      model: 'base',
      language: 'en',
      format: 'vtt',
      duration: 120,
    });
    const onClear = vi.fn();
    const onClose = vi.fn();
    const onSelect = vi.fn();
    const onDelete = vi.fn();

    render(
      <TranscriptionHistory
        history={[mockHistoryItem]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('base')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('.vtt')).toBeInTheDocument();
    expect(screen.getByText(/⏱️/)).toBeInTheDocument();
  });
});
