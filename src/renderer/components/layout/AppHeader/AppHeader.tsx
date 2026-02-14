import React from 'react';
import { Moon, Sun, Terminal } from 'lucide-react';
import { Button } from '../../ui';
import { useAppTheme } from '../../../contexts';
import { useDebugLogs } from '../../../hooks';
import { DebugLogsModal } from '../../ui/DebugLogsModal';
import appIcon from '../../../assets/icon.png';

function AppHeader(): React.JSX.Element {
  const { theme, toggleTheme } = useAppTheme();
  const {
    logs,
    isOpen: isDebugLogsOpen,
    openModal: openDebugLogs,
    closeModal: closeDebugLogs,
    copyLogs,
    copyLogsWithSystemInfo,
    clearLogs,
  } = useDebugLogs();

  return (
    <>
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <img src={appIcon} alt="Speakly" className="app-logo" />
            <div className="header-title">
              <h1>Speakly</h1>
              <p>Speech to text, instantly</p>
            </div>
          </div>
          <div className="header-actions">
            <Button
              variant="icon"
              icon={<Terminal size={18} />}
              iconOnly
              onClick={openDebugLogs}
              title="Debug Logs"
              aria-label="Open debug logs"
            />
            <Button
              variant="icon"
              icon={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              iconOnly
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="theme-toggle"
            />
          </div>
        </div>
      </header>

      <DebugLogsModal
        isOpen={isDebugLogsOpen}
        logs={logs}
        onClose={closeDebugLogs}
        onCopyLogs={copyLogs}
        onCopyLogsWithSystemInfo={copyLogsWithSystemInfo}
        onClearLogs={clearLogs}
      />
    </>
  );
}

export { AppHeader };
