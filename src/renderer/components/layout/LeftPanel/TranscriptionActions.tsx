import React from 'react';
import { Zap } from 'lucide-react';
import { useAppTranscription } from '../../../contexts';

export function TranscriptionActions(): React.JSX.Element {
  const { selectedFile, isTranscribing, modelDownloaded, handleTranscribe, handleCancel } =
    useAppTranscription();

  return (
    <div className="actions">
      {!isTranscribing ? (
        <button
          className="btn-primary"
          onClick={handleTranscribe}
          disabled={!selectedFile || !modelDownloaded}
          aria-label="Start transcription"
          title={!modelDownloaded ? 'Please download the selected model first' : ''}
        >
          <Zap size={18} aria-hidden="true" /> Transcribe
        </button>
      ) : (
        <button
          className="btn-danger"
          onClick={handleCancel}
          aria-label="Cancel ongoing transcription"
        >
          <span className="loading-spinner" aria-hidden="true"></span> Cancel
        </button>
      )}
    </div>
  );
}
