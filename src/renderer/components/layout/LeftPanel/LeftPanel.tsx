import React from 'react';
import { FileDropZone, FileQueue } from '../../../features/transcription';
import { SettingsPanel } from '../../../features/settings';
import { useAppTranscription } from '../../../contexts';
import { useFFmpegStatus } from '../../../hooks';
import { TranscriptionActions } from './TranscriptionActions';
import { ErrorMessage } from './ErrorMessage';
import { DonationSection } from './DonationSection';
import { SystemWarning } from '../../ui';

function LeftPanel(): React.JSX.Element {
  const {
    settings,
    isTranscribing,
    setSettings,
    setModelDownloaded,
    queue,
    selectedQueueItemId,
    handleFilesSelect,
    removeFromQueue,
    clearCompletedFromQueue,
    selectQueueItem,
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
        onFilesSelect={handleFilesSelect}
        queueCount={queue.length}
        disabled={isTranscribing}
      />

      {queue.length > 0 && (
        <FileQueue
          queue={queue}
          onRemove={removeFromQueue}
          onClearCompleted={clearCompletedFromQueue}
          onSelectItem={selectQueueItem}
          selectedItemId={selectedQueueItemId}
          disabled={isTranscribing}
        />
      )}

      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        disabled={isTranscribing}
        onModelStatusChange={setModelDownloaded}
      />

      <TranscriptionActions isFFmpegAvailable={isFFmpegAvailable} />

      <ErrorMessage />

      <DonationSection />
    </div>
  );
}

export { LeftPanel };
