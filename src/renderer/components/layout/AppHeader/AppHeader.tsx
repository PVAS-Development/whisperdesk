import React from 'react';
import { Moon, Sun, History } from 'lucide-react';
import { useAppTheme, useAppHistory } from '../../../contexts';
import appIcon from '../../../assets/icon.png';

function AppHeader(): React.JSX.Element {
  const { theme, toggleTheme } = useAppTheme();
  const { history, showHistory, toggleHistory } = useAppHistory();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <img src={appIcon} alt="WhisperDesk" className="app-logo" />
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
            {theme === 'light' ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
          </button>
          <button
            className="btn-icon history-btn"
            onClick={toggleHistory}
            title="Transcription History"
            aria-label={`${showHistory ? 'Hide' : 'Show'} transcription history. ${history.length} items.`}
          >
            <History size={18} aria-hidden="true" /> History ({history.length})
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
