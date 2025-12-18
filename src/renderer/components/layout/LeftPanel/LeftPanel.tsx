import React from 'react';
import { FileDropZone } from '../../../features/transcription';
import { SettingsPanel } from '../../../features/settings';
import { useAppTranscription } from '../../../contexts';
import { useFFmpegStatus } from '../../../hooks';
import { TranscriptionActions } from './TranscriptionActions';
import { TranscriptionProgress } from './TranscriptionProgress';
import { ErrorMessage } from './ErrorMessage';
import { DonationSection } from './DonationSection';
import { SystemWarning } from '../../ui';

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

  const { isFFmpegAvailable, isChecking, recheckStatus } = useFFmpegStatus();

  return (
    <div className="left-panel">
      {isChecking && isFFmpegAvailable === null && (
        <div className="system-check-loading" role="status" aria-live="polite">
          Checking system requirements...
        </div>
      )}
      {isFFmpegAvailable === false && <SystemWarning onRefresh={recheckStatus} />}

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

      <TranscriptionActions isFFmpegAvailable={isFFmpegAvailable} />

      <TranscriptionProgress />

      <ErrorMessage />

      <DonationSection />
    </div>
  );
}

export { LeftPanel };
