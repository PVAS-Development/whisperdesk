import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  SelectedFile,
  TranscriptionSettings,
  TranscriptionProgress,
  HistoryItem,
  OutputFormat,
} from '../../../types';
import { APP_CONFIG } from '../../../config';

interface UseTranscriptionOptions {
  onHistoryAdd?: (item: HistoryItem) => void;
}

interface UseTranscriptionReturn {
  selectedFile: SelectedFile | null;
  settings: TranscriptionSettings;
  isTranscribing: boolean;
  progress: TranscriptionProgress;
  transcriptionStartTime: number | null;
  transcription: string;
  error: string | null;
  modelDownloaded: boolean;

  setSelectedFile: (file: SelectedFile | null) => void;
  setSettings: (settings: TranscriptionSettings) => void;
  setModelDownloaded: (downloaded: boolean) => void;
  setTranscription: (text: string) => void;
  handleFileSelect: (file: SelectedFile) => void;
  handleFileSelectFromMenu: () => Promise<void>;
  handleTranscribe: () => Promise<void>;
  handleCancel: () => Promise<void>;
  handleSave: (format?: OutputFormat) => Promise<void>;
  handleCopy: (copyToClipboard: (text: string) => Promise<boolean>) => Promise<boolean>;
  clearError: () => void;
}

export function useTranscription(options: UseTranscriptionOptions = {}): UseTranscriptionReturn {
  const { onHistoryAdd } = options;

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
  const [modelDownloaded, setModelDownloaded] = useState<boolean>(true);

  const saveMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    return () => {
      if (saveMessageTimeoutRef.current) {
        clearTimeout(saveMessageTimeoutRef.current);
      }
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
      onHistoryAdd?.(historyItem);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProgress({ percent: 0, status: '' });
    } finally {
      setIsTranscribing(false);
    }
  }, [selectedFile, settings, onHistoryAdd]);

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

      let content: string = transcription;

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

      // For docx, pdf, md formats, the main process will handle the conversion

      const result = await window.electronAPI?.saveFile({
        defaultName: `${fileName}.${format}`,
        content,
        format,
      });

      if (result?.success && result.filePath) {
        setProgress({ percent: 100, status: `Saved to ${result.filePath}` });
        if (saveMessageTimeoutRef.current) {
          clearTimeout(saveMessageTimeoutRef.current);
        }
        saveMessageTimeoutRef.current = setTimeout(() => {
          setProgress({ percent: 0, status: '' });
          saveMessageTimeoutRef.current = null;
        }, APP_CONFIG.SAVE_SUCCESS_MESSAGE_DURATION);
      } else if (result?.error) {
        setError(`Failed to save: ${result.error}`);
      }
    },
    [transcription, selectedFile]
  );

  const handleCopy = useCallback(
    async (copyToClipboard: (text: string) => Promise<boolean>): Promise<boolean> => {
      if (!transcription) return false;
      const success = await copyToClipboard(transcription);
      if (!success) {
        setError('Failed to copy to clipboard');
      }
      return success;
    },
    [transcription]
  );

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  return {
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
    clearError,
  };
}
