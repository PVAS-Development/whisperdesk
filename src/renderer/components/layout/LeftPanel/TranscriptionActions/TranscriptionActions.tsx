import React from 'react';
import { Zap } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { useAppTranscription } from '../../../../contexts';

export interface TranscriptionActionsProps {
  isFFmpegAvailable: boolean | null;
}

function TranscriptionActions({ isFFmpegAvailable }: TranscriptionActionsProps): React.JSX.Element {
  const { selectedFile, isTranscribing, modelDownloaded, handleTranscribe, handleCancel } =
    useAppTranscription();

  const canTranscribe = selectedFile && modelDownloaded && isFFmpegAvailable === true;

  const getDisabledReason = (): string => {
    if (!isFFmpegAvailable) return 'Please install FFmpeg first';
    if (!modelDownloaded) return 'Please download the selected model first';
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
          loading
          fullWidth
        >
          Cancel
        </Button>
      )}
    </div>
  );
}

export { TranscriptionActions };
