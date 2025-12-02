import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SettingsPanel } from '@/features/settings';
import { overrideElectronAPI } from '@/test/utils';
import { MOCK_SETTINGS, createMockModels } from '@/test/fixtures';

describe('SettingsPanel', () => {
  const mockSettings = { ...MOCK_SETTINGS };
  const mockModels = createMockModels(3, [false, true, false]);

  beforeEach(() => {
    vi.clearAllMocks();
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: mockModels }),
      getGpuStatus: vi.fn().mockResolvedValue({
        available: true,
        name: 'NVIDIA RTX 3080',
        memory: '10 GB',
      }),
      onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
    });
  });

  it('should render settings panel with title', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    });
  });

  it('should load and display models on mount', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(window.electronAPI?.listModels).toHaveBeenCalled();
    });
  });

  it('should display model selection dropdown', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Whisper model/i)).toBeInTheDocument();
    });
  });

  it('should display language selection dropdown', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      const langSelect = screen.getByLabelText(/Select transcription language/i);
      expect(langSelect).toBeInTheDocument();
    });
  });

  it('should call onChange when model selection changes', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Whisper model/i)).toBeInTheDocument();
    });

    const modelSelect = screen.getByLabelText(/Select Whisper model/i) as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'small' } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ model: 'small' }));
    });
  });

  it('should call onChange when language selection changes', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      const languageSelect = screen.getByLabelText(/Select transcription language/i);
      fireEvent.change(languageSelect, { target: { value: 'en' } });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ language: 'en' }));
    });
  });

  it('should disable controls when disabled prop is true', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={true} />);

    await waitFor(() => {
      const modelSelect = screen.getByLabelText(/Select Whisper model/i);
      expect(modelSelect).toBeDisabled();
    });
  });

  it('should call onModelStatusChange when model download status changes', async () => {
    const onChange = vi.fn();
    const onModelStatusChange = vi.fn();

    render(
      <SettingsPanel
        settings={mockSettings}
        onChange={onChange}
        disabled={false}
        onModelStatusChange={onModelStatusChange}
      />
    );

    await waitFor(() => {
      expect(window.electronAPI?.listModels).toHaveBeenCalled();
    });
  });

  it('should display GPU status when available', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByText(/GPU|RTX 3080/i)).toBeInTheDocument();
    });
  });

  it('should handle loadModelInfo error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    overrideElectronAPI({
      listModels: vi.fn().mockRejectedValue(new Error('Network error')),
      getGpuStatus: vi.fn().mockRejectedValue(new Error('GPU error')),
      onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
    });

    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should handle model download error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const downloadedModels = createMockModels(3, [false, false, false]);
    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: downloadedModels }),
      getGpuStatus: vi.fn().mockResolvedValue({
        available: true,
        name: 'GPU',
        memory: '8 GB',
      }),
      onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
      downloadModel: vi.fn().mockRejectedValue(new Error('Download failed')),
    });

    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Download/i)).toBeInTheDocument();
    });

    const downloadButton = screen.getByLabelText(/Download/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should persist model selection to localStorage', async () => {
    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Select Whisper model/i)).toBeInTheDocument();
    });

    const modelSelect = screen.getByLabelText(/Select Whisper model/i) as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'small' } });

    expect(localStorage.getItem('whisperdesk_lastModel')).toBe('small');
  });

  it('should show download progress during model download', async () => {
    let progressCallback: ((data: { status: string; percent: number }) => void) | undefined;
    const downloadedModels = createMockModels(3, [false, false, false]);

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: downloadedModels }),
      getGpuStatus: vi.fn().mockResolvedValue({
        available: true,
        name: 'GPU',
        memory: '8 GB',
      }),
      onModelDownloadProgress: vi.fn((callback) => {
        progressCallback = callback;
        return () => {};
      }),
      downloadModel: vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          })
      ),
    });

    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Download/i)).toBeInTheDocument();
    });

    const downloadButton = screen.getByLabelText(/Download/i);
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(screen.getByText(/Downloading/i)).toBeInTheDocument();
    });

    const cb = progressCallback;
    if (cb) {
      act(() => {
        cb({ status: 'progress', percent: 50 });
      });
    }

    await waitFor(() => {
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });
  });

  it('should handle delete model confirmation cancel', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const downloadedModels = createMockModels(3, [true, true, true]);

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: downloadedModels }),
      getGpuStatus: vi.fn().mockResolvedValue({
        available: true,
        name: 'GPU',
        memory: '8 GB',
      }),
      onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
      deleteModel: vi.fn(),
    });

    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Delete/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(/Delete/i);
    fireEvent.click(deleteButton);

    expect(window.electronAPI?.deleteModel).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should handle delete model failure', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const downloadedModels = createMockModels(3, [true, true, true]);

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: downloadedModels }),
      getGpuStatus: vi.fn().mockResolvedValue({
        available: true,
        name: 'GPU',
        memory: '8 GB',
      }),
      onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
      deleteModel: vi.fn().mockResolvedValue({ success: false, error: 'Permission denied' }),
    });

    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Delete/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(/Delete/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Permission denied'));
    });

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should handle delete model exception', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const downloadedModels = createMockModels(3, [true, true, true]);

    overrideElectronAPI({
      listModels: vi.fn().mockResolvedValue({ models: downloadedModels }),
      getGpuStatus: vi.fn().mockResolvedValue({
        available: true,
        name: 'GPU',
        memory: '8 GB',
      }),
      onModelDownloadProgress: vi.fn().mockReturnValue(() => {}),
      deleteModel: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    const onChange = vi.fn();

    render(<SettingsPanel settings={mockSettings} onChange={onChange} disabled={false} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Delete/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(/Delete/i);
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
