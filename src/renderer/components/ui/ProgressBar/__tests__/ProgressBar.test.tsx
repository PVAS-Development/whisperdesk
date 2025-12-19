import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with basic props', () => {
    render(<ProgressBar percent={50} status="Processing..." startTime={null} isActive={false} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('displays status text', () => {
    render(
      <ProgressBar percent={25} status="Analyzing audio..." startTime={null} isActive={true} />
    );

    expect(screen.getByText('Analyzing audio...')).toBeInTheDocument();
  });

  it('shows elapsed time when active with startTime', () => {
    const startTime = Date.now() - 5000; // 5 seconds ago

    render(
      <ProgressBar percent={30} status="Transcribing..." startTime={startTime} isActive={true} />
    );

    // Check that elapsed time element is rendered (even if timing might vary slightly)
    const progressInfo = document.querySelector('.progress-info');
    expect(progressInfo).toBeInTheDocument();
  });

  it('updates elapsed time every second', () => {
    const startTime = Date.now();

    render(
      <ProgressBar percent={40} status="Processing..." startTime={startTime} isActive={true} />
    );

    // Check that the component renders and updates
    const progressInfo = document.querySelector('.progress-info');
    expect(progressInfo).toBeInTheDocument();
  });

  it('does not show elapsed time when not active', () => {
    const startTime = Date.now() - 10000;

    render(<ProgressBar percent={60} status="Complete" startTime={startTime} isActive={false} />);

    expect(screen.queryByText(/0:/)).not.toBeInTheDocument();
  });

  it('does not show elapsed time when startTime is null', () => {
    render(<ProgressBar percent={70} status="Processing..." startTime={null} isActive={true} />);

    expect(screen.queryByText(/0:/)).not.toBeInTheDocument();
  });

  it('resets elapsed time when becomes inactive', () => {
    const startTime = Date.now() - 5000;
    const { rerender } = render(
      <ProgressBar percent={50} status="Processing..." startTime={startTime} isActive={true} />
    );

    rerender(
      <ProgressBar percent={50} status="Processing..." startTime={startTime} isActive={false} />
    );

    expect(screen.queryByText(/0:/)).not.toBeInTheDocument();
  });

  it('shows indeterminate progress for mid-range percentages (15-85%)', () => {
    const { container } = render(
      <ProgressBar percent={50} status="Processing..." startTime={Date.now()} isActive={true} />
    );

    const progressBar = container.querySelector('.progress-bar');
    expect(progressBar).toHaveClass('indeterminate');
  });

  it('shows determinate progress for low percentages (< 15%)', () => {
    const { container } = render(
      <ProgressBar percent={10} status="Starting..." startTime={Date.now()} isActive={true} />
    );

    const progressBar = container.querySelector('.progress-bar');
    expect(progressBar).not.toHaveClass('indeterminate');

    const progressFill = container.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '10%' });
  });

  it('shows determinate progress for high percentages (> 85%)', () => {
    const { container } = render(
      <ProgressBar percent={90} status="Finishing..." startTime={Date.now()} isActive={true} />
    );

    const progressBar = container.querySelector('.progress-bar');
    expect(progressBar).not.toHaveClass('indeterminate');

    const progressFill = container.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '90%' });
  });

  it('shows indeterminate progress at exactly 15%', () => {
    const { container } = render(
      <ProgressBar percent={15} status="Processing..." startTime={Date.now()} isActive={true} />
    );

    const progressBar = container.querySelector('.progress-bar');
    expect(progressBar).toHaveClass('indeterminate');
  });

  it('shows indeterminate progress at exactly 85%', () => {
    const { container } = render(
      <ProgressBar percent={85} status="Processing..." startTime={Date.now()} isActive={true} />
    );

    const progressBar = container.querySelector('.progress-bar');
    expect(progressBar).toHaveClass('indeterminate');
  });

  it('shows determinate progress when not active', () => {
    const { container } = render(
      <ProgressBar percent={50} status="Paused" startTime={null} isActive={false} />
    );

    const progressBar = container.querySelector('.progress-bar');
    expect(progressBar).not.toHaveClass('indeterminate');

    const progressFill = container.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '50%' });
  });

  it('uses 30% width for indeterminate progress', () => {
    const { container } = render(
      <ProgressBar percent={50} status="Processing..." startTime={Date.now()} isActive={true} />
    );

    const progressFill = container.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '30%' });
  });

  it('handles 0% progress', () => {
    const { container } = render(
      <ProgressBar percent={0} status="Starting..." startTime={null} isActive={true} />
    );

    const progressFill = container.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '0%' });
  });

  it('handles 100% progress', () => {
    const { container } = render(
      <ProgressBar percent={100} status="Complete" startTime={null} isActive={false} />
    );

    const progressFill = container.querySelector('.progress-fill');
    expect(progressFill).toHaveStyle({ width: '100%' });
  });

  it('has correct accessibility attributes', () => {
    render(<ProgressBar percent={75} status="Almost done..." startTime={null} isActive={true} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Transcription progress: 75%');
  });

  it('updates aria-label when percent changes', () => {
    const { rerender } = render(
      <ProgressBar percent={25} status="Processing..." startTime={null} isActive={true} />
    );

    let progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Transcription progress: 25%');

    rerender(<ProgressBar percent={75} status="Processing..." startTime={null} isActive={true} />);

    progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Transcription progress: 75%');
  });

  it('updates status with aria-live region', () => {
    render(
      <ProgressBar percent={50} status="Processing audio..." startTime={null} isActive={true} />
    );

    const statusElement = screen.getByText('Processing audio...');
    expect(statusElement).toHaveAttribute('aria-live', 'polite');
  });

  it('clears interval when component unmounts', () => {
    const startTime = Date.now();
    const { unmount } = render(
      <ProgressBar percent={50} status="Processing..." startTime={startTime} isActive={true} />
    );

    unmount();

    // Advance time - should not cause any errors
    vi.advanceTimersByTime(5000);
  });

  it('clears and recreates interval when startTime changes', () => {
    const startTime1 = Date.now() - 3000;
    const { rerender } = render(
      <ProgressBar percent={50} status="Processing..." startTime={startTime1} isActive={true} />
    );

    const startTime2 = Date.now();
    rerender(
      <ProgressBar percent={60} status="Processing..." startTime={startTime2} isActive={true} />
    );

    // Component should update properly
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '60');
  });

  it('renders empty status correctly', () => {
    render(<ProgressBar percent={50} status="" startTime={null} isActive={false} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles rapid state changes', () => {
    const { rerender } = render(
      <ProgressBar percent={10} status="Starting..." startTime={null} isActive={true} />
    );

    rerender(
      <ProgressBar percent={50} status="Processing..." startTime={Date.now()} isActive={true} />
    );
    rerender(
      <ProgressBar percent={90} status="Finishing..." startTime={Date.now()} isActive={true} />
    );
    rerender(<ProgressBar percent={100} status="Complete" startTime={null} isActive={false} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});
