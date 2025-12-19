import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../Button';
import './SystemWarning.css';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { trackEvent, openExternal, getAppInfo, logger } from '../../../services';

const FFMPEG_DOWNLOAD_URL = 'https://ffmpeg.org/download.html';
const VERIFICATION_RETRY_DELAY_MS = 1000;

export interface SystemWarningProps {
  onRefresh: () => Promise<boolean>;
}

function SystemWarning({ onRefresh }: SystemWarningProps): React.JSX.Element {
  const { copyToClipboard, copySuccess } = useCopyToClipboard(2000);
  const [isChecking, setIsChecking] = useState(false);
  const [installCommand, setInstallCommand] = useState('brew install ffmpeg');
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const getPlatform = async () => {
      try {
        const appInfo = await getAppInfo();
        if (appInfo.platform === 'win32') {
          setInstallCommand('winget install ffmpeg');
        } else if (appInfo.platform === 'linux') {
          setInstallCommand('sudo apt install ffmpeg');
        } else {
          setInstallCommand('brew install ffmpeg');
        }
      } catch (error) {
        logger.error('Failed to get platform info:', error);
      }
    };
    getPlatform();
  }, []);

  const handleCopy = () => {
    copyToClipboard(installCommand);
    trackEvent('ffmpeg_install_command_copied', { command: installCommand }).catch((error) => {
      logger.error('Failed to track copy event:', error);
    });
  };

  const handleDownloadLink = async () => {
    trackEvent('ffmpeg_download_link_clicked').catch((error) => {
      logger.error(
        `Failed to track FFmpeg download link click (event: 'ffmpeg_download_link_clicked', url: ${FFMPEG_DOWNLOAD_URL}):`,
        error
      );
    });
    try {
      await openExternal(FFMPEG_DOWNLOAD_URL);
    } catch (error) {
      logger.error('Failed to open link:', error);
    }
  };

  const handleRefresh = async () => {
    setIsChecking(true);
    trackEvent('ffmpeg_check_again_clicked').catch((error) => {
      logger.error('Failed to track refresh event:', error);
    });
    try {
      const isAvailable = await onRefresh();

      if (isAvailable) return;

      if (!isMounted.current) return;

      await new Promise((resolve) => setTimeout(resolve, VERIFICATION_RETRY_DELAY_MS));

      if (!isMounted.current) return;

      await onRefresh();
    } catch (error) {
      logger.error('Failed to refresh FFmpeg status:', error);
    } finally {
      if (isMounted.current) {
        setIsChecking(false);
      }
    }
  };

  return (
    <div className="system-warning">
      <div className="system-warning-header">
        <div className="system-warning-icon-wrapper">
          <AlertTriangle size={24} aria-hidden="true" />
        </div>
        <div className="system-warning-content">
          <h3 className="system-warning-title">FFmpeg Installation Required</h3>
          <p className="system-warning-description">
            WhisperDesk relies on FFmpeg to process your media files. Without it, transcription will
            not work.
          </p>
        </div>
      </div>

      <div className="system-warning-action-area">
        <p className="instruction-text">Run this command in your terminal:</p>
        <div className="system-warning-code">
          <code>{installCommand}</code>
          <Button
            variant="ghost"
            size="sm"
            icon={copySuccess ? <Check size={16} /> : <Copy size={16} />}
            iconOnly
            onClick={handleCopy}
            title="Copy to clipboard"
            aria-label={copySuccess ? 'Copied to clipboard' : 'Copy install command to clipboard'}
          />
        </div>

        <div className="alternative-option">
          <span>Or download manually from</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadLink}
            aria-label="Open FFmpeg download page"
            className="link"
          >
            ffmpeg.org
          </Button>
        </div>
      </div>

      <Button
        icon={<RefreshCw size={16} />}
        onClick={handleRefresh}
        disabled={isChecking}
        loading={isChecking}
        fullWidth
        className="warning"
      >
        {isChecking ? 'Verifying Installation...' : 'I have installed FFmpeg'}
      </Button>
    </div>
  );
}

export { SystemWarning };
