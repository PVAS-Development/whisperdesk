import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SystemWarning } from '../SystemWarning';
import { overrideElectronAPI } from '../../../../test/utils';

const mockCopyToClipboard = vi.fn();
vi.mock('../../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => ({
    copyToClipboard: mockCopyToClipboard,
    copySuccess: false,
  }),
}));

describe('SystemWarning', () => {
  const mockOnRefresh = vi.fn().mockResolvedValue(false);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SystemWarning onRefresh={mockOnRefresh} />);
    expect(screen.getByText('FFmpeg Installation Required')).toBeInTheDocument();
    expect(screen.getByText(/WhisperDesk relies on FFmpeg/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I have installed FFmpeg/i })).toBeInTheDocument();
  });

  it('displays correct install command for macOS', async () => {
    overrideElectronAPI({
      getAppInfo: vi.fn().mockResolvedValue({ platform: 'darwin', version: '1.0.0', isDev: true }),
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText('brew install ffmpeg')).toBeInTheDocument();
    });
  });

  it('displays correct install command for Windows', async () => {
    overrideElectronAPI({
      getAppInfo: vi.fn().mockResolvedValue({ platform: 'win32', version: '1.0.0', isDev: true }),
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText('winget install ffmpeg')).toBeInTheDocument();
    });
  });

  it('displays correct install command for Linux', async () => {
    overrideElectronAPI({
      getAppInfo: vi.fn().mockResolvedValue({ platform: 'linux', version: '1.0.0', isDev: true }),
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText('sudo apt install ffmpeg')).toBeInTheDocument();
    });
  });

  it('calls onRefresh when check button is clicked', async () => {
    render(<SystemWarning onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /I have installed FFmpeg/i });
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
    expect(screen.getByText(/Verifying Installation.../i)).toBeInTheDocument();
  });

  it('copies command to clipboard', async () => {
    overrideElectronAPI({
      getAppInfo: vi.fn().mockResolvedValue({ platform: 'darwin', version: '1.0.0', isDev: true }),
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText('brew install ffmpeg')).toBeInTheDocument();
    });

    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);

    expect(mockCopyToClipboard).toHaveBeenCalledWith('brew install ffmpeg');
  });

  it('opens download link when clicked', async () => {
    const mockOpenExternal = vi.fn().mockResolvedValue(undefined);
    const mockTrackEvent = vi.fn().mockResolvedValue(undefined);
    overrideElectronAPI({
      openExternal: mockOpenExternal,
      trackEvent: mockTrackEvent,
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    const downloadButton = screen.getByText('ffmpeg.org');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith('ffmpeg_download_link_clicked', undefined);
      expect(mockOpenExternal).toHaveBeenCalledWith('https://ffmpeg.org/download.html');
    });
  });

  it('handles openExternal error when clicking download link', async () => {
    const mockOpenExternal = vi.fn().mockRejectedValue(new Error('Failed to open'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    overrideElectronAPI({
      openExternal: mockOpenExternal,
      trackEvent: vi.fn().mockResolvedValue(undefined),
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    const downloadButton = screen.getByText('ffmpeg.org');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to open link:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles trackEvent error when clicking download link', async () => {
    const mockTrackEvent = vi.fn().mockRejectedValue(new Error('Failed to track'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    overrideElectronAPI({
      openExternal: vi.fn().mockResolvedValue(undefined),
      trackEvent: mockTrackEvent,
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    const downloadButton = screen.getByText('ffmpeg.org');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to track FFmpeg download link click'),
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles trackEvent error when clicking refresh', async () => {
    const mockTrackEvent = vi.fn().mockRejectedValue(new Error('Failed to track'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    overrideElectronAPI({
      trackEvent: mockTrackEvent,
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /I have installed FFmpeg/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to track refresh event:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles trackEvent error when clicking copy', async () => {
    const mockTrackEvent = vi.fn().mockRejectedValue(new Error('Failed to track'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    overrideElectronAPI({
      getAppInfo: vi.fn().mockResolvedValue({ platform: 'darwin', version: '1.0.0', isDev: true }),
      trackEvent: mockTrackEvent,
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(screen.getByText('brew install ffmpeg')).toBeInTheDocument();
    });

    const copyButton = screen.getByTitle('Copy to clipboard');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to track copy event:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('handles getAppInfo error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    overrideElectronAPI({
      getAppInfo: vi.fn().mockRejectedValue(new Error('Failed to get info')),
    });

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to get platform info:',
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('retries onRefresh if first attempt fails (returns false)', async () => {
    vi.useFakeTimers();
    mockOnRefresh.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /I have installed FFmpeg/i });
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);

    expect(mockOnRefresh).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('handles onRefresh error', async () => {
    mockOnRefresh.mockRejectedValue(new Error('Refresh failed'));

    render(<SystemWarning onRefresh={mockOnRefresh} />);

    const refreshButton = screen.getByRole('button', { name: /I have installed FFmpeg/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled();
    });
  });
});
