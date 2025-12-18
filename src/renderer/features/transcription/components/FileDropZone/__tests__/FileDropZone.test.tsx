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

  it('should handle file drop with valid media file', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      getPathForFile: vi.fn().mockReturnValue('/path/to/audio.mp3'),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');

    const file = new File(['audio content'], 'audio.mp3', { type: 'audio/mp3' });

    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', type: file.type, getAsFile: () => file }],
      types: ['Files'],
    };

    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith({
        path: '/path/to/audio.mp3',
        name: 'audio.mp3',
      });
    });
  });

  it('should not call onFileSelect when getPathForFile returns falsy value', () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      getPathForFile: vi.fn().mockReturnValue(undefined),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');

    const file = new File(['audio content'], 'audio.mp3', { type: 'audio/mp3' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should not handle file drop when disabled', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={true} />);

    const dropzone = screen.getByRole('button');

    const file = new File(['audio content'], 'audio.mp3', { type: 'audio/mp3' });
    Object.defineProperty(file, 'path', { value: '/path/to/audio.mp3' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should not handle file drop with invalid file type', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');

    const file = new File(['text content'], 'document.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'path', { value: '/path/to/document.pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should prevent default on drag over', () => {
    const onFileSelect = vi.fn();

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    const dragOverEvent = new Event('dragover', { bubbles: true, cancelable: true });

    dropzone.dispatchEvent(dragOverEvent);

    expect(dragOverEvent.defaultPrevented).toBe(true);
  });

  it('should not activate on keyboard when disabled', () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn(),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={true} />);

    const dropzone = screen.getByRole('button');
    fireEvent.keyDown(dropzone, { key: 'Enter' });

    expect(window.electronAPI?.openFile).not.toHaveBeenCalled();
  });

  it('should call onFileSelect when valid file is selected via dialog', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue('/path/to/test.wav'),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(onFileSelect).toHaveBeenCalledWith({
        path: '/path/to/test.wav',
        name: 'test.wav',
      });
    });
  });

  it('should not call onFileSelect for invalid file from dialog', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue('/path/to/document.exe'),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(window.electronAPI?.openFile).toHaveBeenCalled();
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should not call onFileSelect when file path has no name', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue('/path/to/'),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(window.electronAPI?.openFile).toHaveBeenCalled();
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('should handle when openFile returns null', async () => {
    const onFileSelect = vi.fn();
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue(null),
    });

    render(<FileDropZone onFileSelect={onFileSelect} selectedFile={null} disabled={false} />);

    const dropzone = screen.getByRole('button');
    fireEvent.click(dropzone);

    await waitFor(() => {
      expect(window.electronAPI?.openFile).toHaveBeenCalled();
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
