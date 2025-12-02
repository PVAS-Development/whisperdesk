import React from 'react';
import { FileDropZone } from '../../../features/transcription';
import { SettingsPanel } from '../../../features/settings';
import { useAppTranscription } from '../../../contexts';
import { TranscriptionActions } from './TranscriptionActions';
import { TranscriptionProgress } from './TranscriptionProgress';
import { ErrorMessage } from './ErrorMessage';

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

  return (
    <div className="left-panel">
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
    </div>
  );
}

export default LeftPanel;
