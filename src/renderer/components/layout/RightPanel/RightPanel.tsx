import React from 'react';
import { OutputDisplay } from '../../../features/transcription';
import { TranscriptionHistory } from '../../../features/history';
import { useAppHistory, useAppTranscription } from '../../../contexts';

function RightPanel(): React.JSX.Element {
  const {
    history,
    showHistory,
    setShowHistory,
    clearHistory,
    selectHistoryItem,
    removeHistoryItem,
  } = useAppHistory();
  const { transcription, copySuccess, handleSave, handleCopy } = useAppTranscription();

  if (showHistory) {
    return (
      <div className="right-panel">
        <TranscriptionHistory
          history={history}
          onClear={clearHistory}
          onClose={() => setShowHistory(false)}
          onSelect={selectHistoryItem}
          onDelete={removeHistoryItem}
        />
      </div>
    );
  }

  return (
    <div className="right-panel">
      <OutputDisplay
        text={transcription}
        onSave={handleSave}
        onCopy={handleCopy}
        copySuccess={copySuccess}
      />
    </div>
  );
}

export default RightPanel;
