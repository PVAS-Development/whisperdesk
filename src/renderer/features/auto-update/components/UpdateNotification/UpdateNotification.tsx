import { useAutoUpdate } from '../../hooks/useAutoUpdate';
import { convertHtmlToText } from '../../../../utils';
import { X, AlertTriangle, Sparkles, Download, CheckCircle } from 'lucide-react';
import './UpdateNotification.css';

export function UpdateNotification() {
  const {
    updateStatus,
    isDownloading,
    isUpdateAvailable,
    isUpdateDownloaded,
    error,
    downloadUpdate,
    installUpdate,
    dismissUpdate,
  } = useAutoUpdate();

  if (
    !updateStatus ||
    updateStatus.status === 'checking' ||
    updateStatus.status === 'not-available'
  ) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      dismissUpdate();
    }
  };

  return (
    <div
      className="update-notification"
      onClick={dismissUpdate}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="update-notification-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={dismissUpdate} className="btn-close" aria-label="Close">
          <X size={20} />
        </button>

        {error && (
          <div className="update-error">
            <div className="update-header">
              <span className="update-icon">
                <AlertTriangle size={24} />
              </span>
              <div className="update-text">
                <h3>Update Error</h3>
                <p>{error}</p>
              </div>
            </div>
            <button
              onClick={dismissUpdate}
              className="btn-dismiss"
              style={{ alignSelf: 'flex-end' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {isUpdateAvailable && !error && (
          <div className="update-available">
            <div className="update-header">
              <span className="update-icon">
                <Sparkles size={24} />
              </span>
              <div className="update-text">
                <h3>Update Available</h3>
                <p>Version {updateStatus.info?.version} is available</p>
              </div>
            </div>
            {updateStatus.info?.releaseNotes && (
              <details className="release-notes">
                <summary>What's New</summary>
                <div className="release-notes-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {convertHtmlToText(updateStatus.info.releaseNotes)}
                </div>
              </details>
            )}
            <div className="update-actions">
              <button onClick={downloadUpdate} className="btn-download">
                Download Update
              </button>
              <button onClick={dismissUpdate} className="btn-dismiss">
                Later
              </button>
            </div>
          </div>
        )}

        {isDownloading && (
          <div className="update-downloading">
            <div className="update-header">
              <span className="update-icon">
                <Download size={24} />
              </span>
              <div className="update-text">
                <h3>Downloading Update</h3>
              </div>
            </div>
            {updateStatus.progress && (
              <>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${updateStatus.progress.percent}%` }}
                  />
                </div>
                <p className="progress-details">
                  {updateStatus.progress.percent.toFixed(1)}% •{' '}
                  {formatBytes(updateStatus.progress.transferred)} /{' '}
                  {formatBytes(updateStatus.progress.total)} •{' '}
                  {formatSpeed(updateStatus.progress.bytesPerSecond)}
                </p>
              </>
            )}
          </div>
        )}

        {isUpdateDownloaded && !error && (
          <div className="update-downloaded">
            <div className="update-header">
              <span className="update-icon">
                <CheckCircle size={24} />
              </span>
              <div className="update-text">
                <h3>Update Ready</h3>
                <p>Version {updateStatus.info?.version} has been downloaded</p>
              </div>
            </div>
            <div className="update-actions">
              <button onClick={installUpdate} className="btn-install">
                Restart & Install
              </button>
              <button onClick={dismissUpdate} className="btn-dismiss">
                Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
