import React from 'react';
import { ProgressBar } from '../../../ui';
import { useAppTranscription } from '../../../../contexts';

function TranscriptionProgress(): React.JSX.Element | null {
  const { isTranscribing, progress, transcriptionStartTime } = useAppTranscription();

  if (!isTranscribing && !progress.status) {
    return null;
  }

  return (
    <ProgressBar
      percent={progress.percent}
      status={progress.status}
      startTime={transcriptionStartTime}
      isActive={isTranscribing}
    />
  );
}

export { TranscriptionProgress };
