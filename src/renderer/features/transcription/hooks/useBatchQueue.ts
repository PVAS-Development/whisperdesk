import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  SelectedFile,
  TranscriptionSettings,
  QueueItem,
  QueueItemStatus,
  HistoryItem,
} from '../../../types';
import {
  startTranscription,
  cancelTranscription,
  onTranscriptionProgress,
} from '../../../services/electronAPI';
import { logger } from '../../../services/logger';
import { sanitizePath } from '../../../../shared/utils';

interface UseBatchQueueOptions {
  settings: TranscriptionSettings;
  onHistoryAdd?: (item: HistoryItem) => void;
  onFirstComplete?: (id: string, text: string) => void;
}

interface UseBatchQueueReturn {
  queue: QueueItem[];
  isProcessing: boolean;
  currentItemId: string | null;

  addFiles: (files: SelectedFile[]) => void;
  removeFile: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;

  startProcessing: () => Promise<void>;
  cancelProcessing: () => Promise<void>;

  getCompletedTranscription: (id: string) => string | undefined;
}

function generateId(): string {
  return crypto.randomUUID();
}

export function useBatchQueue(options: UseBatchQueueOptions): UseBatchQueueReturn {
  const { settings, onHistoryAdd, onFirstComplete } = options;

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const isCancelledRef = useRef(false);
  const hasCalledFirstCompleteRef = useRef(false);
  const progressUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
        progressUnsubscribeRef.current = null;
      }
    };
  }, []);

  const addFiles = useCallback((files: SelectedFile[]) => {
    const newItems: QueueItem[] = files.map((file) => ({
      id: generateId(),
      file,
      status: 'pending' as QueueItemStatus,
      progress: { percent: 0, status: '' },
    }));

    setQueue((prev) => [...prev, ...newItems]);

    logger.info('Added files to batch queue', {
      count: files.length,
      files: files.map((f) => f.name),
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    logger.info('Removed file from batch queue', { id });
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) =>
      prev.filter((item) => item.status !== 'completed' && item.status !== 'cancelled')
    );
    logger.info('Cleared completed items from batch queue');
  }, []);

  const clearAll = useCallback(() => {
    if (isProcessing) {
      logger.warn('Cannot clear queue while processing');
      return;
    }
    setQueue([]);
    logger.info('Cleared all items from batch queue');
  }, [isProcessing]);

  const processItem = useCallback(
    async (item: QueueItem): Promise<QueueItem> => {
      const startTime = Date.now();

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'processing' as QueueItemStatus, startTime } : q
        )
      );
      setCurrentItemId(item.id);

      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
        progressUnsubscribeRef.current = null;
      }

      progressUnsubscribeRef.current = onTranscriptionProgress((progress) => {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, progress } : q)));
      });

      logger.info('Processing batch item', {
        id: item.id,
        file: sanitizePath(item.file.path),
        model: settings.model,
        language: settings.language,
      });

      try {
        const result = await startTranscription({
          filePath: item.file.path,
          model: settings.model,
          language: settings.language,
          outputFormat: 'vtt',
        });

        const endTime = Date.now();

        if (isCancelledRef.current) {
          return {
            ...item,
            status: 'cancelled',
            endTime,
          };
        }

        if (!result || result.error || !result.success) {
          const error = result?.error || 'Transcription failed';
          logger.error('Batch item failed', { id: item.id, error });
          return {
            ...item,
            status: 'error',
            error,
            endTime,
          };
        }

        if (result.cancelled) {
          return {
            ...item,
            status: 'cancelled',
            endTime,
          };
        }

        if (!result.text) {
          return {
            ...item,
            status: 'error',
            error: 'Transcription produced no output',
            endTime,
          };
        }

        logger.info('Batch item completed', {
          id: item.id,
          durationMs: endTime - startTime,
        });

        if (onHistoryAdd) {
          const historyItem: HistoryItem = {
            id: crypto.randomUUID(),
            fileName: item.file.name,
            filePath: item.file.path,
            model: settings.model,
            language: settings.language,
            date: new Date().toISOString(),
            duration: Math.round((endTime - startTime) / 1000),
            preview: result.text.substring(0, 100) + (result.text.length > 100 ? '...' : ''),
            fullText: result.text,
          };
          onHistoryAdd(historyItem);
        }

        if (!hasCalledFirstCompleteRef.current && onFirstComplete && result.text) {
          hasCalledFirstCompleteRef.current = true;
          onFirstComplete(item.id, result.text);
        }

        return {
          ...item,
          status: 'completed',
          result,
          progress: { percent: 100, status: 'Complete!' },
          endTime,
        };
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Batch item threw error', { id: item.id, error: err });
        return {
          ...item,
          status: 'error',
          error,
          endTime: Date.now(),
        };
      } finally {
        if (progressUnsubscribeRef.current) {
          progressUnsubscribeRef.current();
          progressUnsubscribeRef.current = null;
        }
      }
    },
    [settings, onHistoryAdd, onFirstComplete]
  );

  const startProcessing = useCallback(async () => {
    if (isProcessing) return;

    const itemsToProcess = queue.filter(
      (item) => item.status === 'pending' || item.status === 'cancelled' || item.status === 'error'
    );

    if (itemsToProcess.length === 0) {
      logger.warn('No items to process');
      return;
    }

    setQueue((prev) =>
      prev.map((item) =>
        item.status === 'cancelled' || item.status === 'error'
          ? { ...item, status: 'pending' as QueueItemStatus, error: undefined, endTime: undefined }
          : item
      )
    );

    setIsProcessing(true);
    isCancelledRef.current = false;
    hasCalledFirstCompleteRef.current = false;

    logger.info('Starting batch processing', { count: itemsToProcess.length });

    for (const item of itemsToProcess) {
      if (isCancelledRef.current) {
        setQueue((prev) =>
          prev.map((q) =>
            q.status === 'pending' ? { ...q, status: 'cancelled' as QueueItemStatus } : q
          )
        );
        break;
      }

      const resetItem = { ...item, status: 'pending' as QueueItemStatus, error: undefined };
      const processedItem = await processItem(resetItem);
      setQueue((prev) => prev.map((q) => (q.id === processedItem.id ? processedItem : q)));
    }

    setIsProcessing(false);
    setCurrentItemId(null);
    logger.info('Batch processing complete');
  }, [isProcessing, queue, processItem]);

  const cancelProcessing = useCallback(async () => {
    if (!isProcessing) return;

    isCancelledRef.current = true;
    await cancelTranscription();

    setIsProcessing(false);
    setCurrentItemId(null);

    setQueue((prev) =>
      prev.map((q) =>
        q.status === 'processing' || q.status === 'pending'
          ? { ...q, status: 'cancelled' as QueueItemStatus, endTime: Date.now() }
          : q
      )
    );

    if (progressUnsubscribeRef.current) {
      progressUnsubscribeRef.current();
      progressUnsubscribeRef.current = null;
    }

    logger.warn('Batch processing cancelled by user');
  }, [isProcessing]);

  const getCompletedTranscription = useCallback(
    (id: string): string | undefined => {
      const item = queue.find((q) => q.id === id);
      if (item?.status === 'completed' && item.result?.text) {
        return item.result.text;
      }
      return undefined;
    },
    [queue]
  );

  return {
    queue,
    isProcessing,
    currentItemId,

    addFiles,
    removeFile,
    clearCompleted,
    clearAll,

    startProcessing,
    cancelProcessing,

    getCompletedTranscription,
  };
}
