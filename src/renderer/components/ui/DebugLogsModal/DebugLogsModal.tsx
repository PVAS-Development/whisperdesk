import React, { useEffect, useCallback } from 'react';
import { X, Terminal, Copy, Clipboard, Trash2 } from 'lucide-react';
import type { LogEntry } from '../../../services/logger';
import './DebugLogsModal.css';

interface DebugLogsModalProps {
  isOpen: boolean;
  logs: LogEntry[];
  onClose: () => void;
  onCopyLogs: () => Promise<boolean>;
  onCopyLogsWithSystemInfo: () => Promise<boolean>;
  onClearLogs: () => void;
}

function formatLogEntry(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString().substring(11, 23);
  const level = entry.level.toUpperCase().padEnd(5);
  const data = entry.data !== undefined ? ` | ${JSON.stringify(entry.data)}` : '';
  return `[${timestamp}] [${level}] ${entry.message}${data}`;
}

function DebugLogsModal({
  isOpen,
  logs,
  onClose,
  onCopyLogs,
  onCopyLogsWithSystemInfo,
  onClearLogs,
}: DebugLogsModalProps): React.JSX.Element | null {
  const [copyState, setCopyState] = React.useState<'idle' | 'logs' | 'info'>('idle');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    return undefined;
  }, [isOpen, handleKeyDown]);

  const handleCopyLogs = async () => {
    const success = await onCopyLogs();
    if (success) {
      setCopyState('logs');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const handleCopyWithInfo = async () => {
    const success = await onCopyLogsWithSystemInfo();
    if (success) {
      setCopyState('info');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="debug-logs-overlay" onClick={handleOverlayClick}>
      <div
        className="debug-logs-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="debug-logs-title"
      >
        <div className="debug-logs-header">
          <h2 id="debug-logs-title">
            <Terminal size={18} aria-hidden="true" />
            Debug Logs
            <span className="log-count">({logs.length} entries)</span>
          </h2>
          <button className="debug-logs-close" onClick={onClose} aria-label="Close debug logs">
            <X size={20} />
          </button>
        </div>

        <div className="debug-logs-content">
          {logs.length === 0 ? (
            <div className="debug-logs-empty">
              <Terminal size={48} aria-hidden="true" />
              <p>No logs captured yet.</p>
              <p>Logs will appear here as you use the application.</p>
            </div>
          ) : (
            logs.map((entry, index) => (
              <div
                key={`${entry.timestamp.getTime()}-${index}`}
                className={`log-entry level-${entry.level}`}
              >
                {formatLogEntry(entry)}
              </div>
            ))
          )}
        </div>

        <div className="debug-logs-footer">
          <button
            className={`btn-copy-logs ${copyState === 'logs' ? 'copied' : ''}`}
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
          >
            <Copy size={16} aria-hidden="true" />
            {copyState === 'logs' ? 'Copied!' : 'Copy Logs'}
          </button>
          <button
            className={`btn-copy-with-info ${copyState === 'info' ? 'copied' : ''}`}
            onClick={handleCopyWithInfo}
            disabled={logs.length === 0}
          >
            <Clipboard size={16} aria-hidden="true" />
            {copyState === 'info' ? 'Copied!' : 'Copy with System Info'}
          </button>
          <button className="btn-clear-logs" onClick={onClearLogs} disabled={logs.length === 0}>
            <Trash2 size={16} aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

export { DebugLogsModal };
export type { DebugLogsModalProps };
