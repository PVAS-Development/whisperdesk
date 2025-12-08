import React, { useState, useEffect } from 'react';
import { Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import './SystemWarning.css';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { trackEvent } from '../../../services/electronAPI';

export interface SystemWarningProps {
  onRefresh: () => Promise<void>;
}

function SystemWarning({ onRefresh }: SystemWarningProps): React.JSX.Element {
  const { copyToClipboard, copySuccess } = useCopyToClipboard(2000);
  const [isChecking, setIsChecking] = useState(false);
  const [installCommand, setInstallCommand] = useState('brew install ffmpeg');

  useEffect(() => {
    const getPlatform = async () => {
      if (window.electronAPI?.getAppInfo) {
        try {
          const appInfo = await window.electronAPI.getAppInfo();
          if (appInfo.platform === 'win32') {
            setInstallCommand('winget install ffmpeg');
          } else if (appInfo.platform === 'linux') {
            setInstallCommand('sudo apt install ffmpeg');
          } else {
            setInstallCommand('brew install ffmpeg');
          }
        } catch (error) {
          console.error('Failed to get platform info:', error);
        }
      }
    };
    getPlatform();
  }, []);

  const handleCopy = () => {
    copyToClipboard(installCommand);
    trackEvent('ffmpeg_install_command_copied', { command: installCommand }).catch((error) => {
      console.error('Failed to track copy event:', error);
    });
  };

  const handleRefresh = async () => {
    setIsChecking(true);
    trackEvent('ffmpeg_check_again_clicked').catch((error) => {
      console.error('Failed to track refresh event:', error);
    });
    try {
      await onRefresh();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="system-warning">
      <div className="system-warning-title">
        <AlertTriangle size={18} aria-hidden="true" />
        FFmpeg Not Found
      </div>
      <div className="system-warning-description">
        FFmpeg is required for audio/video processing. Most transcriptions will fail without it.
      </div>
      <div className="system-warning-code">
        <code>{installCommand}</code>
        <button
          className="copy-button"
          onClick={handleCopy}
          title="Copy to clipboard"
          aria-label={copySuccess ? 'Copied to clipboard' : 'Copy install command to clipboard'}
        >
          {copySuccess ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
        </button>
      </div>
      <button className="refresh-button" onClick={handleRefresh} disabled={isChecking}>
        {isChecking ? (
          <>
            <RefreshCw size={14} className="spin" aria-hidden="true" /> Checking...
          </>
        ) : (
          <>
            <RefreshCw size={14} aria-hidden="true" /> Check Again
          </>
        )}
      </button>
    </div>
  );
}

export default SystemWarning;
