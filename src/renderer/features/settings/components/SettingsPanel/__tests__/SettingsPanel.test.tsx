import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPanel } from '../SettingsPanel';
import type { TranscriptionSettings } from '../../../../../types';
import { overrideElectronAPI } from '../../../../../test/utils';
import { MOCK_SETTINGS, createMockModels, MOCK_GPU_INFO } from '../../../../../test/fixtures';
import { logger } from '../../../../../services/logger';

describe('SettingsPanel', () => {
  const mockSettings = MOCK_SETTINGS;
  const mockModels = createMockModels(3, [false, true, false]);
  const mockGpuInfo = MOCK_GPU_INFO;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders settings panel with model and language selects', async () => {
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Whisper model')).toBeInTheDocument();
      expect(screen.getByLabelText('Select transcription language')).toBeInTheDocument();
    });
  });

  it('displays GPU status when available', async () => {
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByText('Apple Silicon (Metal)')).toBeInTheDocument();
    });
  });

  it('calls onChange when model is selected', async () => {
    const onChange = vi.fn();
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Whisper model')).toBeInTheDocument();
    });

    const modelSelect = screen.getByLabelText('Select Whisper model') as HTMLSelectElement;
    await waitFor(() => {
      expect(modelSelect).not.toBeDisabled();
    });
    fireEvent.change(modelSelect, { target: { value: 'small' } });

    expect(onChange).toHaveBeenCalledWith({
      ...mockSettings,
      model: 'small',
    });
  });

  it('calls onChange when language is selected', async () => {
    const onChange = vi.fn();
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select transcription language')).toBeInTheDocument();
    });

    const langSelect = screen.getByLabelText('Select transcription language') as HTMLSelectElement;
    fireEvent.change(langSelect, { target: { value: 'es' } });

    expect(onChange).toHaveBeenCalledWith({
      ...mockSettings,
      language: 'es',
    });
  });

  it('displays model details for selected model', async () => {
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByText('~16x')).toBeInTheDocument();
    });
  });

  it('shows download button for non-downloaded models', async () => {
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });
  });

  it('shows ready state and delete button for downloaded models', async () => {
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Ready to use/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument();
    });
  });

  it('calls downloadModel when download button is clicked', async () => {
    const downloadModel = vi.fn().mockResolvedValue({ success: true });
    const listModels = vi.fn().mockResolvedValue({ models: mockModels });

    overrideElectronAPI({
      listModels,
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      downloadModel,
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(downloadModel).toHaveBeenCalledWith('tiny');
    });
  });

  it('handles download progress updates', async () => {
    const onModelDownloadProgress = vi.fn((callback) => {
      setTimeout(() => {
        callback({
          status: 'progress',
          percent: 50,
          remainingTime: '2m',
        });
      }, 0);
      return vi.fn();
    });

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      downloadModel: vi.fn().mockResolvedValue({ success: true }),
      onModelDownloadProgress,
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(onModelDownloadProgress).toHaveBeenCalled();
    });
  });

  it('handles download completion', async () => {
    const listModels = vi.fn().mockResolvedValue({ models: mockModels });
    const onModelDownloadProgress = vi.fn((callback) => {
      setTimeout(() => {
        callback({
          status: 'complete',
          percent: 100,
        });
      }, 0);
      return vi.fn();
    });

    overrideElectronAPI({
      listModels,
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      downloadModel: vi.fn().mockResolvedValue({ success: true }),
      onModelDownloadProgress,
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(listModels).toHaveBeenCalledTimes(2);
    });
  });

  it('handles download error', async () => {
    const onModelDownloadProgress = vi.fn((callback) => {
      setTimeout(() => {
        callback({
          status: 'error',
          error: 'Network error',
        });
      }, 0);
      return vi.fn();
    });

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      downloadModel: vi.fn().mockResolvedValue({ success: true }),
      onModelDownloadProgress,
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });
  });

  it('calls deleteModel when delete button is clicked and confirmed', async () => {
    const deleteModel = vi.fn().mockResolvedValue({ success: true });
    const listModels = vi.fn().mockResolvedValue({ models: mockModels });

    overrideElectronAPI({
      listModels,
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      deleteModel,
    });

    window.confirm = vi.fn().mockReturnValue(true);

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete base model/ })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete base model/ });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete the base model?'
      );
      expect(deleteModel).toHaveBeenCalledWith('base');
    });
  });

  it('does not call deleteModel when delete is cancelled', async () => {
    const deleteModel = vi.fn();

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      deleteModel,
    });

    window.confirm = vi.fn().mockReturnValue(false);

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete base model/ })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete base model/ });
    fireEvent.click(deleteButton);

    expect(deleteModel).not.toHaveBeenCalled();
  });

  it('shows error alert when delete fails', async () => {
    const deleteModel = vi.fn().mockResolvedValue({
      success: false,
      error: 'Permission denied',
    });

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      deleteModel,
    });

    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete base model/ })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete base model/ });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to delete model: Permission denied');
    });
  });

  it('shows error alert when delete throws exception', async () => {
    const deleteModel = vi.fn().mockRejectedValue(new Error('Network error'));

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      deleteModel,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete base model/ })).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete base model/ });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to delete model'));
    });

    consoleSpy.mockRestore();
  });

  it('calls onModelStatusChange when model status changes', async () => {
    const onModelStatusChange = vi.fn();

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    const { rerender } = render(
      <SettingsPanel
        settings={mockSettings}
        onChange={vi.fn()}
        disabled={false}
        onModelStatusChange={onModelStatusChange}
      />
    );

    await waitFor(() => {
      expect(onModelStatusChange).toHaveBeenCalledWith(true);
    });

    rerender(
      <SettingsPanel
        settings={{ ...mockSettings, model: 'tiny' }}
        onChange={vi.fn()}
        disabled={false}
        onModelStatusChange={onModelStatusChange}
      />
    );

    await waitFor(() => {
      expect(onModelStatusChange).toHaveBeenCalledWith(false);
    });
  });

  it('persists model selection to localStorage', async () => {
    const onChange = vi.fn();

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Whisper model')).toBeInTheDocument();
    });

    const modelSelect = screen.getByLabelText('Select Whisper model') as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'small' } });

    await waitFor(() => {
      expect(localStorage.getItem('whisperdesk_lastModel')).toBe('small');
    });
  });

  it('disables controls when disabled prop is true', async () => {
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={true} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Whisper model')).toBeDisabled();
      expect(screen.getByLabelText('Select transcription language')).toBeDisabled();
    });
  });

  it('handles missing electronAPI gracefully', async () => {
    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Whisper model')).toBeInTheDocument();
    });
  });

  it('restores model from localStorage when different from current settings', async () => {
    const onChange = vi.fn();
    localStorage.setItem('whisperdesk_lastModel', 'small');

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ model: 'small' }));
    });

    localStorage.removeItem('whisperdesk_lastModel');
  });

  it('does not restore model from localStorage if it is invalid', async () => {
    const onChange = vi.fn();
    localStorage.setItem('whisperdesk_lastModel', 'nonexistent');

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Whisper model')).toBeInTheDocument();
    });

    expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ model: 'nonexistent' }));

    localStorage.removeItem('whisperdesk_lastModel');
  });

  it('calls onModelStatusChange with false when model is not downloaded', async () => {
    const onModelStatusChange = vi.fn();

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(
      <SettingsPanel
        settings={settings}
        onChange={vi.fn()}
        disabled={false}
        onModelStatusChange={onModelStatusChange}
      />
    );

    await waitFor(() => {
      expect(onModelStatusChange).toHaveBeenCalledWith(false);
    });
  });

  it('handles download model failure gracefully', async () => {
    const downloadModel = vi.fn().mockRejectedValue(new Error('Download failed'));
    const listModels = vi.fn().mockResolvedValue({ models: mockModels });

    overrideElectronAPI({
      listModels,
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      downloadModel,
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(logger.error).toHaveBeenCalledWith('Failed to download model:', expect.any(Error));
    });
  });

  it('shows GPU status as unavailable when GPU is not available', async () => {
    const unavailableGpuInfo = { ...mockGpuInfo, available: false };

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(unavailableGpuInfo),
    });

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(
        screen.getByRole('status', { name: /GPU acceleration: disabled/i })
      ).toBeInTheDocument();
    });
  });

  it('handles model info loading failure', async () => {
    overrideElectronAPI({
      listModels: vi.fn().mockRejectedValue(new Error('Failed to load')),
      getGpuStatus: vi.fn().mockRejectedValue(new Error('Failed to get GPU')),
    });

    render(<SettingsPanel settings={mockSettings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Select Whisper model')).toBeInTheDocument();
    });

    expect(logger.error).toHaveBeenCalledWith('Failed to load model info:', expect.any(Error));
  });

  it('displays download progress without remaining time', async () => {
    const onModelDownloadProgress = vi.fn((callback) => {
      setTimeout(() => {
        callback({
          status: 'progress',
          percent: 50,
          remainingTime: '',
        });
      }, 0);
      return vi.fn();
    });

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      downloadModel: vi.fn().mockResolvedValue({ success: true }),
      onModelDownloadProgress,
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(onModelDownloadProgress).toHaveBeenCalled();
    });
  });

  it('displays download progress with remaining time', async () => {
    const onModelDownloadProgress = vi.fn((callback) => {
      setTimeout(() => {
        callback({
          status: 'progress',
          percent: 75,
          remainingTime: ' 5m remaining',
        });
      }, 0);
      return vi.fn();
    });

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue(mockGpuInfo),
      downloadModel: vi.fn().mockResolvedValue({ success: true }),
      onModelDownloadProgress,
    });

    const settings: TranscriptionSettings = { ...mockSettings, model: 'tiny' as const };

    render(<SettingsPanel settings={settings} onChange={vi.fn()} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Download/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(onModelDownloadProgress).toHaveBeenCalled();
    });
  });
});
