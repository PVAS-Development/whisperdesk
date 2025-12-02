import React, { useState, useEffect } from 'react';
import { formatTime } from '../../../utils';
import './ProgressBar.css';

interface ProgressBarProps {
  percent: number;
  status: string;
  startTime: number | null;
  isActive: boolean;
}

function ProgressBar({
  percent,
  status,
  startTime,
  isActive,
}: ProgressBarProps): React.JSX.Element {
  const [elapsed, setElapsed] = useState<number>(0);

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

  const isIndeterminate = isActive && percent >= 15 && percent <= 85;

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
