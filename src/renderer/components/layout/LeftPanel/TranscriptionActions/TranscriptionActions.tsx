import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { useAppTranscription } from '../../../../contexts';

export interface TranscriptionActionsProps {
  isFFmpegAvailable: boolean | null;
}

function TranscriptionActions({ isFFmpegAvailable }: TranscriptionActionsProps): React.JSX.Element {
  const { isTranscribing, modelDownloaded, handleTranscribe, handleCancel, queue } =
    useAppTranscription();

  const { retryableCount } = useMemo(() => {
    let retryable = 0;
    for (const item of queue) {
      if (item.status === 'pending') {
        retryable++;
      } else if (item.status === 'cancelled' || item.status === 'error') {
        retryable++;
      }
    }
    return { retryableCount: retryable };
  }, [queue]);

  const canTranscribe = retryableCount > 0 && modelDownloaded && isFFmpegAvailable === true;

  const getDisabledReason = (): string => {
    if (!isFFmpegAvailable) return 'Please install FFmpeg first';
    if (!modelDownloaded) return 'Please download the selected model first';
    if (retryableCount === 0) return 'Add files to queue to transcribe';
    return '';
  };

  return (
    <div className="actions">
      {!isTranscribing ? (
        <Button
          variant="primary"
          size="lg"
          icon={<Zap size={18} />}
          onClick={handleTranscribe}
          disabled={!canTranscribe}
          aria-label="Start transcription"
          title={getDisabledReason()}
          fullWidth
        >
          Transcribe
        </Button>
      ) : (
        <Button
          variant="danger"
          size="lg"
          onClick={handleCancel}
          aria-label="Cancel ongoing transcription"
          fullWidth
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

export { TranscriptionActions };
