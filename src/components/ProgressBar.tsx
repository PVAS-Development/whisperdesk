import React, { useState, useEffect } from 'react';
import './ProgressBar.css';

// =============================================================================
// Props Interface
// =============================================================================

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  percent: number;
  /** Status message to display */
  status: string;
  /** Timestamp when transcription started (for elapsed time calculation) */
  startTime: number | null;
  /** Whether transcription is actively running */
  isActive: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format seconds into human-readable time string
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  } else {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  }
}

// =============================================================================
// Component
// =============================================================================

function ProgressBar({
  percent,
  status,
  startTime,
  isActive,
}: ProgressBarProps): React.JSX.Element {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [elapsed, setElapsed] = useState<number>(0);

  // -------------------------------------------------------------------------
  // Elapsed Time Effect
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }

    const updateElapsed = (): void => {
      setElapsed((Date.now() - startTime) / 1000);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  // -------------------------------------------------------------------------
  // Derived State
  // -------------------------------------------------------------------------

  // Show indeterminate state when in the middle of transcribing
  const isIndeterminate = isActive && percent >= 15 && percent <= 85;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      className="progress-container"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Transcription progress: ${percent}%`}
    >
      <div className={`progress-bar ${isIndeterminate ? 'indeterminate' : ''}`}>
        <div className="progress-fill" style={{ width: isIndeterminate ? '30%' : `${percent}%` }} />
      </div>
      <div className="progress-info">
        {status && (
          <span className="progress-status" aria-live="polite">
            {status}
          </span>
        )}
        {isActive && elapsed > 0 && <span className="progress-elapsed">{formatTime(elapsed)}</span>}
      </div>
    </div>
  );
}

export default ProgressBar;
