import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SystemWarning from '../SystemWarning';
import { overrideElectronAPI } from '../../../../test/utils';

const mockCopyToClipboard = vi.fn();
vi.mock('../../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => ({
    copyToClipboard: mockCopyToClipboard,
    copySuccess: false,
  }),
}));

describe('SystemWarning', () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SystemWarning onRefresh={mockOnRefresh} />);
    expect(screen.getByText('FFmpeg Not Found')).toBeInTheDocument();
    expect(screen.getByText(/FFmpeg is required/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check Again/i })).toBeInTheDocument();
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

    const refreshButton = screen.getByRole('button', { name: /Check Again/i });
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalled();
    expect(screen.getByText(/Checking.../i)).toBeInTheDocument();
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
});
