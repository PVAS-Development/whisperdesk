import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DebugLogsModal } from '../DebugLogsModal';
import type { LogEntry } from '../../../../services/logger';

describe('DebugLogsModal', () => {
  const mockLogs: LogEntry[] = [
    {
      timestamp: new Date('2024-01-01T12:00:00.123Z'),
      level: 'info',
      message: 'Test info message',
    },
    {
      timestamp: new Date('2024-01-01T12:00:01.456Z'),
      level: 'warn',
      message: 'Test warning message',
      data: { key: 'value' },
    },
    {
      timestamp: new Date('2024-01-01T12:00:02.789Z'),
      level: 'error',
      message: 'Test error message',
      data: { error: 'details' },
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnCopyLogs = vi.fn();
  const mockOnCopyLogsWithSystemInfo = vi.fn();
  const mockOnClearLogs = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <DebugLogsModal
        isOpen={false}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Debug Logs')).toBeInTheDocument();
    expect(screen.getByText(/3 entries/i)).toBeInTheDocument();
  });

  it('displays logs with correct formatting', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    expect(screen.getByText(/Test info message/)).toBeInTheDocument();
    expect(screen.getByText(/Test warning message/)).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('displays empty state when no logs', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={[]}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    expect(screen.getByText('No logs captured yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Logs will appear here as you use the application.')
    ).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const closeButton = screen.getByLabelText('Close debug logs');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not call onClose when modal content is clicked', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onCopyLogs when copy logs button is clicked', async () => {
    mockOnCopyLogs.mockResolvedValue(true);

    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy logs/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockOnCopyLogs).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('calls onCopyLogsWithSystemInfo when button is clicked', async () => {
    mockOnCopyLogsWithSystemInfo.mockResolvedValue(true);

    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const copyWithInfoButton = screen.getByRole('button', { name: /copy with system info/i });
    fireEvent.click(copyWithInfoButton);

    await waitFor(() => {
      expect(mockOnCopyLogsWithSystemInfo).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('calls onClearLogs when clear button is clicked', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    expect(mockOnClearLogs).toHaveBeenCalledTimes(1);
  });

  it('disables copy and clear buttons when no logs', () => {
    render(
      <DebugLogsModal
        isOpen={true}
        logs={[]}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const copyLogsButton = screen.getByRole('button', { name: /copy logs/i });
    const copyWithInfoButton = screen.getByRole('button', { name: /copy with system info/i });
    const clearButton = screen.getByRole('button', { name: /clear/i });

    expect(copyLogsButton).toBeDisabled();
    expect(copyWithInfoButton).toBeDisabled();
    expect(clearButton).toBeDisabled();
  });

  it('does not show copied state when copy fails', async () => {
    mockOnCopyLogs.mockResolvedValue(false);

    render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    const copyButton = screen.getByRole('button', { name: /copy logs/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockOnCopyLogs).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
    expect(screen.getByText('Copy Logs')).toBeInTheDocument();
  }, 10000);

  it('formats log entries correctly', () => {
    const logWithData: LogEntry = {
      timestamp: new Date('2024-01-01T12:34:56.789Z'),
      level: 'debug',
      message: 'Debug message',
      data: { test: 'data' },
    };

    const logWithoutData: LogEntry = {
      timestamp: new Date('2024-01-01T12:34:56.789Z'),
      level: 'info',
      message: 'Info message',
    };

    render(
      <DebugLogsModal
        isOpen={true}
        logs={[logWithData, logWithoutData]}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    expect(screen.getByText(/Debug message/)).toBeInTheDocument();
    expect(screen.getByText(/Info message/)).toBeInTheDocument();
  });

  it('cleans up event listener when modal is closed', () => {
    const { rerender } = render(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    rerender(
      <DebugLogsModal
        isOpen={false}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('adds keydown listener only when modal is open', () => {
    const { rerender } = render(
      <DebugLogsModal
        isOpen={false}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).not.toHaveBeenCalled();

    rerender(
      <DebugLogsModal
        isOpen={true}
        logs={mockLogs}
        onClose={mockOnClose}
        onCopyLogs={mockOnCopyLogs}
        onCopyLogsWithSystemInfo={mockOnCopyLogsWithSystemInfo}
        onClearLogs={mockOnClearLogs}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
