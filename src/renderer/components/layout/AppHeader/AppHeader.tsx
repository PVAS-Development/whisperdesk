import React from 'react';
import { useAppTheme, useAppHistory } from '../../../contexts';

function AppHeader(): React.JSX.Element {
  const { theme, toggleTheme } = useAppTheme();
  const { history, showHistory, toggleHistory } = useAppHistory();

  return (
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
  );
}

export default AppHeader;
