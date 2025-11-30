import React, { useCallback } from 'react';
import { FileDropZone, OutputDisplay, useTranscription } from './features/transcription';
import { SettingsPanel } from './features/settings';
import { TranscriptionHistory, useHistory } from './features/history';
import { UpdateNotification } from './features/updates';
import { ProgressBar } from './components';
import { useTheme, useElectronMenu, useCopyToClipboard } from './hooks';
import './App.css';

import type { HistoryItem } from './types';

function App(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();

  const { copySuccess, copyToClipboard } = useCopyToClipboard();

  const { history, showHistory, setShowHistory, toggleHistory, addHistoryItem, clearHistory } =
    useHistory();

  const {
    selectedFile,
    settings,
    isTranscribing,
    progress,
    transcriptionStartTime,
    transcription,
    error,
    modelDownloaded,
    setSelectedFile,
    setSettings,
    setModelDownloaded,
    setTranscription,
    handleFileSelect,
    handleFileSelectFromMenu,
    handleTranscribe,
    handleCancel,
    handleSave,
    handleCopy,
  } = useTranscription({
    onHistoryAdd: addHistoryItem,
  });

  // Handle history item selection
  const handleHistorySelect = useCallback(
    (item: HistoryItem): void => {
      setTranscription(item.fullText);
      setSelectedFile({ name: item.fileName, path: item.filePath });
      setShowHistory(false);
    },
    [setTranscription, setSelectedFile, setShowHistory]
  );

  // Handle copy action
  const onCopy = useCallback(async (): Promise<void> => {
    await handleCopy(copyToClipboard);
  }, [handleCopy, copyToClipboard]);

  // Handle Electron menu events
  useElectronMenu({
    onOpenFile: () => {
      if (!isTranscribing) {
        handleFileSelectFromMenu();
      }
    },
    onSaveFile: () => {
      if (transcription && !isTranscribing) {
        handleSave();
      }
    },
    onCopyTranscription: () => {
      if (transcription) {
        onCopy();
      }
    },
    onStartTranscription: () => {
      if (selectedFile && !isTranscribing) {
        handleTranscribe();
      }
    },
    onCancelTranscription: () => {
      if (isTranscribing) {
        handleCancel();
      }
    },
    onToggleHistory: toggleHistory,
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="app-logo">🎙️</div>
            <div className="header-title">
              <h1>WhisperDesk</h1>
              <p>Transcribe audio & video with AI</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              className="btn-icon history-btn"
              onClick={toggleHistory}
              title="Transcription History"
              aria-label={`${showHistory ? 'Hide' : 'Show'} transcription history. ${history.length} items.`}
            >
              📜 History ({history.length})
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
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

          <div className="actions">
            {!isTranscribing ? (
              <button
                className="btn-primary"
                onClick={handleTranscribe}
                disabled={!selectedFile || !modelDownloaded}
                aria-label="Start transcription"
                title={!modelDownloaded ? 'Please download the selected model first' : ''}
              >
                🚀 Transcribe
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

          {(isTranscribing || progress.status) && (
            <ProgressBar
              percent={progress.percent}
              status={progress.status}
              startTime={transcriptionStartTime}
              isActive={isTranscribing}
            />
          )}

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="right-panel">
          {showHistory ? (
            <TranscriptionHistory
              history={history}
              onClear={clearHistory}
              onClose={() => setShowHistory(false)}
              onSelect={handleHistorySelect}
            />
          ) : (
            <OutputDisplay
              text={transcription}
              onSave={handleSave}
              onCopy={onCopy}
              copySuccess={copySuccess}
            />
          )}
        </div>
      </main>

      <UpdateNotification />
    </div>
  );
}

export default App;
