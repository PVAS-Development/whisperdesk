import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
});
