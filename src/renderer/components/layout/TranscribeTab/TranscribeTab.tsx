import React from 'react';
import { FileDropZone, FileQueue, OutputDisplay } from '../../../features/transcription';
import { useAppTranscription } from '../../../contexts';
import { useFFmpegStatus } from '../../../hooks';
import { TranscriptionActions } from '../LeftPanel/TranscriptionActions';
import { ErrorMessage } from '../LeftPanel/ErrorMessage';
import { SystemWarning } from '../../ui';
import './TranscribeTab.css';

function TranscribeTab(): React.JSX.Element {
  const {
    isTranscribing,
    transcription,
    copySuccess,
    queue,
    selectedQueueItemId,
    handleFilesSelect,
    removeFromQueue,
    clearCompletedFromQueue,
    selectQueueItem,
    handleSave,
    handleCopy,
  } = useAppTranscription();

  const { isFFmpegAvailable, isChecking, recheckStatus } = useFFmpegStatus();

  return (
    <div
      className="transcribe-tab"
      id="panel-transcribe"
      role="tabpanel"
      aria-labelledby="tab-transcribe"
    >
      {isChecking && isFFmpegAvailable === null && (
        <div className="system-check-loading" role="status" aria-live="polite">
          Checking system requirements...
        </div>
      )}
      {isFFmpegAvailable === false && <SystemWarning onRefresh={recheckStatus} />}

      <div className="transcribe-tab-controls">
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

        <TranscriptionActions isFFmpegAvailable={isFFmpegAvailable} />
        <ErrorMessage />
      </div>

      <div className="transcribe-tab-output">
        <OutputDisplay
          text={transcription}
          onSave={handleSave}
          onCopy={handleCopy}
          copySuccess={copySuccess}
        />
      </div>
    </div>
  );
}

export { TranscribeTab };
