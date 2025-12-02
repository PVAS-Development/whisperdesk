import React, { useCallback, useMemo, type ReactNode } from 'react';
import { useTranscription } from '../features/transcription';
import { useHistory } from '../features/history';
import { useTheme, useCopyToClipboard, useElectronMenu } from '../hooks';
import type { HistoryItem } from '../types';
import { ThemeContext, HistoryContext, TranscriptionContext } from './contexts';
import type { ThemeContextValue, HistoryContextValue, TranscriptionContextValue } from './types';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps): React.JSX.Element {
  const { theme, toggleTheme, isDark } = useTheme();

  const { copySuccess, copyToClipboard } = useCopyToClipboard();

  const {
    history,
    showHistory,
    setShowHistory,
    toggleHistory,
    addHistoryItem,
    clearHistory,
    removeHistoryItem,
  } = useHistory();

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

  const selectHistoryItem = useCallback(
    (item: HistoryItem): void => {
      setTranscription(item.fullText);
      setSelectedFile({ name: item.fileName, path: item.filePath });
      setShowHistory(false);
    },
    [setTranscription, setSelectedFile, setShowHistory]
  );

  const onCopy = useCallback(async (): Promise<void> => {
    await handleCopy(copyToClipboard);
  }, [handleCopy, copyToClipboard]);

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

  const themeContextValue = useMemo<ThemeContextValue>(
    () => ({ theme, toggleTheme, isDark }),
    [theme, toggleTheme, isDark]
  );

  const historyContextValue = useMemo<HistoryContextValue>(
    () => ({
      history,
      showHistory,
      setShowHistory,
      toggleHistory,
      clearHistory,
      removeHistoryItem,
      selectHistoryItem,
    }),
    [
      history,
      showHistory,
      setShowHistory,
      toggleHistory,
      clearHistory,
      removeHistoryItem,
      selectHistoryItem,
    ]
  );

  const transcriptionContextValue = useMemo<TranscriptionContextValue>(
    () => ({
      selectedFile,
      settings,
      isTranscribing,
      progress,
      transcriptionStartTime,
      transcription,
      error,
      modelDownloaded,
      copySuccess,
      setSelectedFile,
      setSettings,
      setModelDownloaded,
      handleFileSelect,
      handleTranscribe,
      handleCancel,
      handleSave,
      handleCopy: onCopy,
    }),
    [
      selectedFile,
      settings,
      isTranscribing,
      progress,
      transcriptionStartTime,
      transcription,
      error,
      modelDownloaded,
      copySuccess,
      setSelectedFile,
      setSettings,
      setModelDownloaded,
      handleFileSelect,
      handleTranscribe,
      handleCancel,
      handleSave,
      onCopy,
    ]
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <HistoryContext.Provider value={historyContextValue}>
        <TranscriptionContext.Provider value={transcriptionContextValue}>
          {children}
        </TranscriptionContext.Provider>
      </HistoryContext.Provider>
    </ThemeContext.Provider>
  );
}
