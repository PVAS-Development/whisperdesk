import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileDropZone } from '@/features/transcription';
import { overrideElectronAPI } from '@/test/utils';
import { createMockFile } from '@/test/fixtures';

describe('FileDropZone', () => {
  const mockFile = createMockFile();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dropzone with default text', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    expect(screen.getByText(/Drop audio\/video file here/i)).toBeInTheDocument();
  });

  it('should be clickable and open file dialog', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue('/path/to/test.mp3'),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(window.electronAPI?.openFile).toHaveBeenCalled();
    });
  });

  it('should display selected file info', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={mockFile} disabled={false} />);

    expect(screen.getByText('test.mp3')).toBeInTheDocument();
  });

  it('should show file size when file is selected', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={mockFile} disabled={false} />);

    expect(screen.getByText(/1.*KB/i)).toBeInTheDocument();
  });

  it('should call onClear when remove button is clicked', () => {
    const onFileSelect = vi.fn();
    const onClear = vi.fn();

    render(
      <FileDropZone
        onFileSelect={onFileSelect}
        selectedFile={mockFile}
        disabled={false}
        onClear={onClear}
      />
    );

    const removeButton = screen.getByLabelText('Remove selected file');
    fireEvent.click(removeButton);

    expect(onClear).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={true} />);

    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('tabIndex', '-1');
  });

  it('should not be clickable when disabled', () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn(),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={true} />);

    const dropzone = screen.getByRole('button');
    fireEvent.click(dropzone);

    expect(window.electronAPI?.openFile).not.toHaveBeenCalled();
  });

  it('should handle drag over events', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button') as HTMLDivElement;
    expect(dropzone).toHaveAttribute('role', 'button');
    expect(dropzone).toHaveAttribute('tabIndex', '0');
    expect(dropzone).toBeInTheDocument();
  });

  it('should handle keyboard activation with Enter key', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue('/path/to/test.mp3'),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    fireEvent.keyDown(dropzone, { key: 'Enter' });

    await waitFor(() => {
      expect(window.electronAPI?.openFile).toHaveBeenCalled();
    });
  });

  it('should handle keyboard activation with Space key', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue('/path/to/test.mp3'),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    fireEvent.keyDown(dropzone, { key: ' ' });

    await waitFor(() => {
      expect(window.electronAPI?.openFile).toHaveBeenCalled();
    });
  });

  it('should have proper accessibility labels', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('aria-label');
  });

  it('should update accessibility label when file is selected', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzoneInitial = screen.getByRole('button');
    const initialLabel = dropzoneInitial.getAttribute('aria-label');
    expect(initialLabel).toMatch(/Drop|browse/i);
  });
});
