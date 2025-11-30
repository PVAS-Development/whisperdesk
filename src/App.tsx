import React, { useState, useEffect, useCallback } from 'react';
import FileDropZone from './components/FileDropZone';
import SettingsPanel from './components/SettingsPanel';
import ProgressBar from './components/ProgressBar';
import OutputDisplay from './components/OutputDisplay';
import TranscriptionHistory from './components/TranscriptionHistory';
import UpdateNotification from './components/UpdateNotification';
import './App.css';

import type {
  SelectedFile,
  TranscriptionSettings,
  TranscriptionProgress,
  HistoryItem,
  OutputFormat,
  Unsubscribe,
} from './types';

type Theme = 'light' | 'dark';

const loadHistory = (): HistoryItem[] => {
  try {
    const saved = localStorage.getItem('whisperdesk_history');
    if (saved) {
      return JSON.parse(saved) as HistoryItem[];
    }
    return [];
  } catch {
    return [];
  }
};

const saveHistory = (history: HistoryItem[]): void => {
  try {
    const trimmed = history.slice(0, 20);
    localStorage.setItem('whisperdesk_history', JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
};

const loadTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('whisperdesk_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'light';
  } catch {
    return 'light';
  }
};

function App(): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [settings, setSettings] = useState<TranscriptionSettings>({
    model: 'base',
    language: 'auto',
  });
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [progress, setProgress] = useState<TranscriptionProgress>({
    percent: 0,
    status: '',
  });
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<number | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [modelDownloaded, setModelDownloaded] = useState<boolean>(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('whisperdesk_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback((): void => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI?.onTranscriptionProgress(
      (data: TranscriptionProgress) => {
        setProgress(data);
      }
    );
    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleFileSelect = useCallback((file: SelectedFile): void => {
    setSelectedFile(file);
    setTranscription('');
    setError(null);
    setProgress({ percent: 0, status: '' });
  }, []);

  const handleFileSelectFromMenu = useCallback(async (): Promise<void> => {
    const filePath = await window.electronAPI?.openFile();
    if (filePath) {
      const fileInfo = await window.electronAPI?.getFileInfo(filePath);
      if (fileInfo) {
        handleFileSelect(fileInfo);
      }
    }
  }, [handleFileSelect]);

  const handleTranscribe = useCallback(async (): Promise<void> => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    setError(null);
    setProgress({ percent: 0, status: 'Starting transcription...' });
    setTranscriptionStartTime(Date.now());

    const startTime = Date.now();

    try {
      const result = await window.electronAPI?.startTranscription({
        filePath: selectedFile.path,
        model: settings.model,
        language: settings.language,
        outputFormat: 'vtt',
      });

      if (!result) {
        throw new Error('No response from transcription service');
      }

      if (result.cancelled) {
        setProgress({ percent: 0, status: 'Cancelled' });
        return;
      }

      if (!result.text) {
        throw new Error('Transcription produced no output');
      }

      setTranscription(result.text);
      setProgress({ percent: 100, status: 'Complete!' });

      const historyItem: HistoryItem = {
        id: Date.now(),
        fileName: selectedFile.name,
        filePath: selectedFile.path,
        model: settings.model,
        language: settings.language,
        date: new Date().toISOString(),
        duration: Math.round((Date.now() - startTime) / 1000),
        preview: result.text.substring(0, 100) + (result.text.length > 100 ? '...' : ''),
        fullText: result.text,
      };
      const newHistory = [historyItem, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProgress({ percent: 0, status: '' });
    } finally {
      setIsTranscribing(false);
    }
  }, [selectedFile, settings, history]);

  const handleCancel = useCallback(async (): Promise<void> => {
    await window.electronAPI?.cancelTranscription();
    setIsTranscribing(false);
    setProgress({ percent: 0, status: 'Cancelled' });
    setTranscriptionStartTime(null);
  }, []);

  const handleSave = useCallback(
    async (format: OutputFormat = 'vtt'): Promise<void> => {
      if (!transcription) return;

      const fileName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'transcription';

      let content = transcription;
      if (format === 'txt') {
        content = transcription
          .split('\n')
          .filter((line) => !line.startsWith('WEBVTT') && !line.match(/^\d{2}:\d{2}/))
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      } else if (format === 'srt') {
        const lines = transcription.split('\n').filter((l) => l.trim());
        const srtLines: string[] = [];
        let index = 1;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line && line.includes('-->')) {
            srtLines.push(String(index++));
            srtLines.push(line.replace(/\./g, ','));
          } else if (line && !line.startsWith('WEBVTT')) {
            srtLines.push(line);
            const nextLine = lines[i + 1];
            if (nextLine?.includes('-->') || i === lines.length - 1) {
              srtLines.push('');
            }
          }
        }
        content = srtLines.join('\n');
      }

      const result = await window.electronAPI?.saveFile({
        defaultName: `${fileName}.${format}`,
        content,
        format,
      });

      if (result?.success && result.filePath) {
        setProgress({ percent: 100, status: `Saved to ${result.filePath}` });
      } else if (result?.error) {
        setError(`Failed to save: ${result.error}`);
      }
    },
    [transcription, selectedFile]
  );

  const handleCopy = useCallback(async (): Promise<void> => {
    if (!transcription) return;

    try {
      await navigator.clipboard.writeText(transcription);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  }, [transcription]);

  const clearHistory = useCallback((): void => {
    setHistory([]);
    localStorage.removeItem('whisperdesk_history');
  }, []);

  useEffect(() => {
    const unsubscribers: (Unsubscribe | undefined)[] = [];

    unsubscribers.push(
      window.electronAPI?.onMenuOpenFile(() => {
        if (!isTranscribing) {
          handleFileSelectFromMenu();
        }
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuSaveFile(() => {
        if (transcription && !isTranscribing) {
          handleSave();
        }
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuCopyTranscription(() => {
        if (transcription) {
          handleCopy();
        }
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuStartTranscription(() => {
        if (selectedFile && !isTranscribing) {
          handleTranscribe();
        }
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuCancelTranscription(() => {
        if (isTranscribing) {
          handleCancel();
        }
      })
    );

    unsubscribers.push(
      window.electronAPI?.onMenuToggleHistory(() => {
        setShowHistory((prev) => !prev);
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub?.());
    };
  }, [
    isTranscribing,
    selectedFile,
    transcription,
    handleFileSelectFromMenu,
    handleSave,
    handleCopy,
    handleTranscribe,
    handleCancel,
  ]);

  const handleSettingsChange = useCallback((newSettings: TranscriptionSettings): void => {
    setSettings(newSettings);
  }, []);

  const handleHistorySelect = useCallback((item: HistoryItem): void => {
    setTranscription(item.fullText);
    setSelectedFile({ name: item.fileName, path: item.filePath });
    setShowHistory(false);
  }, []);

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
              onClick={() => setShowHistory(!showHistory)}
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
            onChange={handleSettingsChange}
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
              onCopy={handleCopy}
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
