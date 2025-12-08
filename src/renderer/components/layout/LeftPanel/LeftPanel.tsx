import React, { useEffect, useState, useCallback } from 'react';
import { FileDropZone } from '../../../features/transcription';
import { SettingsPanel } from '../../../features/settings';
import { useAppTranscription } from '../../../contexts';
import { TranscriptionActions } from './TranscriptionActions';
import { TranscriptionProgress } from './TranscriptionProgress';
import { ErrorMessage } from './ErrorMessage';
import { DonationSection } from './DonationSection';
import { SystemWarning } from '../../ui';
import { checkFFmpeg } from '../../../services/electronAPI';

function LeftPanel(): React.JSX.Element {
  const {
    selectedFile,
    settings,
    isTranscribing,
    setSelectedFile,
    setSettings,
    setModelDownloaded,
    handleFileSelect,
  } = useAppTranscription();

  const [isFFmpegAvailable, setIsFFmpegAvailable] = useState<boolean | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const available = await checkFFmpeg();
      setIsFFmpegAvailable(available);
    } catch (error) {
      console.error('Failed to check FFmpeg status:', error);
      setIsFFmpegAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <div className="left-panel">
      {isFFmpegAvailable === null && (
        <div className="system-check-loading" role="status" aria-live="polite">
          Checking system requirements...
        </div>
      )}
      {isFFmpegAvailable === false && <SystemWarning onRefresh={checkStatus} />}

      <FileDropZone
        onFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        disabled={isTranscribing}
        onClear={() => setSelectedFile(null)}
      />

      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        disabled={isTranscribing}
        onModelStatusChange={setModelDownloaded}
      />

      <TranscriptionActions />

      <TranscriptionProgress />

      <ErrorMessage />

      <DonationSection />
    </div>
  );
}

export default LeftPanel;
