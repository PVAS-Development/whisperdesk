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
import { STORAGE_KEYS } from '../../../utils/storage';
import { sanitizePath } from '../../../../shared/utils';
import { toUserFriendlyTranscriptionError } from '../utils/errorMessages';

interface UseBatchQueueOptions {
  settings: TranscriptionSettings;
  onHistoryAdd?: (item: HistoryItem) => void;
  onFirstComplete?: (id: string, text: string, file: SelectedFile) => void;
}

interface UseBatchQueueReturn {
  queue: QueueItem[];
  isProcessing: boolean;
  currentItemId: string | null;
  duplicateFilesSkipped: number;
  estimatedTimeRemainingSec: number | null;
  showQueueResumePrompt: boolean;
  restoredQueueItemsCount: number;

  addFiles: (files: SelectedFile[]) => void;
  removeFile: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  dismissQueueResumePrompt: () => void;
  resumePersistedQueue: () => Promise<void>;

  startProcessing: () => Promise<void>;
  retryFailed: () => Promise<void>;
  cancelProcessing: () => Promise<void>;

  getCompletedTranscription: (id: string) => string | undefined;
}

function generateId(): string {
  return crypto.randomUUID();
}

function getFileIdentityKey(file: SelectedFile): string {
  if (file.fingerprint) {
    return `fingerprint:${file.fingerprint}`;
  }
  return `path:${file.path}`;
}

type PersistedQueueStatus = Extract<
  QueueItemStatus,
  'pending' | 'processing' | 'error' | 'cancelled'
>;

interface PersistedQueueItem {
  id: string;
  file: SelectedFile;
  status: PersistedQueueStatus;
  error?: string;
}

interface EtaSample {
  durationMs: number;
  fileSize?: number;
}

const QUEUE_STORAGE_KEY = STORAGE_KEYS.QUEUE;
const MIN_PROGRESS_FOR_ETA_PERCENT = 5;

function getPositiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function getAverageDurationMs(samples: EtaSample[]): number | null {
  if (samples.length === 0) {
    return null;
  }

  const totalMs = samples.reduce((total, sample) => total + sample.durationMs, 0);
  return totalMs / samples.length;
}

function getDurationPerByteMs(samples: EtaSample[]): number | null {
  const sizedSamples = samples.filter(
    (sample) =>
      getPositiveNumber(sample.durationMs) !== null && getPositiveNumber(sample.fileSize) !== null
  );

  if (sizedSamples.length === 0) {
    return null;
  }

  const totalMs = sizedSamples.reduce((total, sample) => total + sample.durationMs, 0);
  const totalBytes = sizedSamples.reduce((total, sample) => total + (sample.fileSize ?? 0), 0);

  return totalBytes > 0 ? totalMs / totalBytes : null;
}

function estimateFileDurationMs(
  file: SelectedFile,
  samples: EtaSample[],
  fallbackDurationMs: number | null = null,
  fallbackFile: SelectedFile | null = null
): number | null {
  const fileSize = getPositiveNumber(file.size);
  const durationPerByteMs = getDurationPerByteMs(samples);

  if (fileSize !== null && durationPerByteMs !== null) {
    return fileSize * durationPerByteMs;
  }

  const fallbackFileSize = getPositiveNumber(fallbackFile?.size);
  if (fileSize !== null && fallbackFileSize !== null && fallbackDurationMs !== null) {
    return (fallbackDurationMs / fallbackFileSize) * fileSize;
  }

  return getAverageDurationMs(samples) ?? fallbackDurationMs;
}

function estimateCurrentItemDurationMs(
  currentItem: QueueItem,
  startTimeMs: number,
  progressPercent: number,
  samples: EtaSample[],
  nowMs: number
): number | null {
  const elapsedMs = Math.max(0, nowMs - startTimeMs);
  const progressRatio = progressPercent / 100;
  const progressEstimateMs =
    progressPercent >= MIN_PROGRESS_FOR_ETA_PERCENT && progressPercent <= 100 && elapsedMs > 0
      ? elapsedMs / progressRatio
      : null;
  const sampleEstimateMs = estimateFileDurationMs(currentItem.file, samples);

  if (progressEstimateMs !== null && sampleEstimateMs !== null) {
    const progressWeight = Math.min(0.85, Math.max(0.35, progressRatio));
    return progressEstimateMs * progressWeight + sampleEstimateMs * (1 - progressWeight);
  }

  return progressEstimateMs ?? sampleEstimateMs;
}

function calculateEtaMs({
  currentItem,
  currentItemStartTimeMs,
  progressPercent,
  remainingItems,
  samples,
  nowMs,
}: {
  currentItem: QueueItem | null;
  currentItemStartTimeMs: number | null;
  progressPercent: number;
  remainingItems: QueueItem[];
  samples: EtaSample[];
  nowMs: number;
}): number | null {
  let currentEstimateMs: number | null = null;
  let currentRemainingMs = 0;

  if (currentItem && currentItemStartTimeMs !== null) {
    currentEstimateMs = estimateCurrentItemDurationMs(
      currentItem,
      currentItemStartTimeMs,
      progressPercent,
      samples,
      nowMs
    );

    if (currentEstimateMs !== null) {
      currentRemainingMs = Math.max(
        0,
        currentEstimateMs - Math.max(0, nowMs - currentItemStartTimeMs)
      );
    }
  }

  const queuedEstimateMs = remainingItems.reduce((total, item) => {
    const estimateMs = estimateFileDurationMs(
      item.file,
      samples,
      currentEstimateMs,
      currentItem?.file ?? null
    );
    return estimateMs === null ? total : total + estimateMs;
  }, 0);

  const totalMs = currentRemainingMs + queuedEstimateMs;
  return totalMs > 0 ? totalMs : null;
}

function toEstimatedSeconds(remainingMs: number | null): number | null {
  if (remainingMs === null) {
    return null;
  }

  return Math.max(1, Math.round(remainingMs / 1000));
}

function isPersistedQueueStatus(status: unknown): status is PersistedQueueStatus {
  return (
    status === 'pending' || status === 'processing' || status === 'error' || status === 'cancelled'
  );
}

function toQueueItem(item: PersistedQueueItem): QueueItem {
  const status: QueueItemStatus = item.status === 'processing' ? 'pending' : item.status;
  return {
    id: item.id,
    file: item.file,
    status,
    progress: { percent: 0, status: '' },
    error:
      status === 'error' && item.error ? toUserFriendlyTranscriptionError(item.error) : undefined,
  };
}

function loadPersistedQueue(): QueueItem[] {
  try {
    const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!savedQueue) {
      return [];
    }

    const parsedQueue: unknown = JSON.parse(savedQueue);
    if (!Array.isArray(parsedQueue)) {
      return [];
    }

    return parsedQueue.reduce<QueueItem[]>((items, rawItem) => {
      if (!rawItem || typeof rawItem !== 'object') {
        return items;
      }

      const candidate = rawItem as Partial<PersistedQueueItem>;
      if (typeof candidate.id !== 'string' || !isPersistedQueueStatus(candidate.status)) {
        return items;
      }

      const file = candidate.file;
      if (
        !file ||
        typeof file !== 'object' ||
        typeof file.name !== 'string' ||
        typeof file.path !== 'string'
      ) {
        return items;
      }

      const normalizedFile: SelectedFile = {
        name: file.name,
        path: file.path,
        size: typeof file.size === 'number' ? file.size : undefined,
        fingerprint: typeof file.fingerprint === 'string' ? file.fingerprint : undefined,
      };

      items.push(
        toQueueItem({
          id: candidate.id,
          file: normalizedFile,
          status: candidate.status,
          error: typeof candidate.error === 'string' ? candidate.error : undefined,
        })
      );
      return items;
    }, []);
  } catch {
    return [];
  }
}

function getResumableQueueItems(queue: QueueItem[]): PersistedQueueItem[] {
  return queue.reduce<PersistedQueueItem[]>((items, item) => {
    if (item.status === 'completed') {
      return items;
    }

    items.push({
      id: item.id,
      file: {
        name: item.file.name,
        path: item.file.path,
        size: item.file.size,
        fingerprint: item.file.fingerprint,
      },
      status: item.status,
      error: item.status === 'error' ? item.error : undefined,
    });

    return items;
  }, []);
}

function persistQueueSnapshot(resumableItems: PersistedQueueItem[]): void {
  try {
    if (resumableItems.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
      return;
    }

    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(resumableItems));
  } catch (error) {
    logger.error('Failed to persist batch queue:', error);
  }
}

function showBatchCompletionNotification(items: QueueItem[]): void {
  if (typeof Notification === 'undefined' || items.length === 0) {
    return;
  }

  const completedCount = items.filter((item) => item.status === 'completed').length;
  const failedCount = items.filter((item) => item.status === 'error').length;
  const cancelledCount = items.filter((item) => item.status === 'cancelled').length;

  const title = items.length > 1 ? 'Batch transcription complete' : 'Transcription complete';
  const summaryParts: string[] = [];

  if (completedCount > 0) summaryParts.push(`${completedCount} completed`);
  if (failedCount > 0) summaryParts.push(`${failedCount} failed`);
  if (cancelledCount > 0) summaryParts.push(`${cancelledCount} cancelled`);

  const body = summaryParts.length > 0 ? summaryParts.join(' • ') : `${items.length} processed`;

  const notify = (): void => {
    try {
      new Notification(title, { body });
    } catch (error) {
      logger.warn('Failed to create completion notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  try {
    if (Notification.permission === 'granted') {
      notify();
      return;
    }

    if (Notification.permission === 'default') {
      void Notification.requestPermission()
        .then((permission) => {
          if (permission === 'granted') {
            notify();
          }
        })
        .catch(() => {});
    }
  } catch (error) {
    logger.warn('Failed to show completion notification', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function useBatchQueue(options: UseBatchQueueOptions): UseBatchQueueReturn {
  const { settings, onHistoryAdd, onFirstComplete } = options;

  const [queue, setQueue] = useState<QueueItem[]>(() => loadPersistedQueue());
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [duplicateFilesSkipped, setDuplicateFilesSkipped] = useState(0);
  const [estimatedTimeRemainingSec, setEstimatedTimeRemainingSec] = useState<number | null>(null);
  const [showQueueResumePrompt, setShowQueueResumePrompt] = useState(false);
  const [restoredQueueItemsCount, setRestoredQueueItemsCount] = useState(0);

  const isCancelledRef = useRef(false);
  const hasCalledFirstCompleteRef = useRef(false);
  const progressUnsubscribeRef = useRef<(() => void) | null>(null);
  const queueRef = useRef<QueueItem[]>(queue);
  const initialQueueLengthRef = useRef(queue.length);
  const shouldPersistQueueRef = useRef(true);
  const lastPersistedQueueSnapshotRef = useRef<string | null>(null);
  const activeRunItemIdsRef = useRef<Set<string>>(new Set());
  const currentItemStartTimeRef = useRef<number | null>(null);
  const currentProcessingItemRef = useRef<QueueItem | null>(null);
  const remainingItemsRef = useRef<QueueItem[]>([]);
  const etaSamplesRef = useRef<EtaSample[]>([]);
  const lastProgressPercentRef = useRef<number>(0);
  const etaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const restoredCount = initialQueueLengthRef.current;
    if (restoredCount > 0) {
      setShowQueueResumePrompt(true);
      setRestoredQueueItemsCount(restoredCount);
    }
  }, []);

  useEffect(() => {
    // Always keep the latest queue in ref for add/remove calculations.
    queueRef.current = queue;

    // Persist only for structural/status changes, not progress ticks.
    if (!shouldPersistQueueRef.current) {
      return;
    }
    shouldPersistQueueRef.current = false;

    const resumableItems = getResumableQueueItems(queue);

    const currentSnapshot = JSON.stringify(resumableItems);
    if (currentSnapshot === lastPersistedQueueSnapshotRef.current) {
      return;
    }

    lastPersistedQueueSnapshotRef.current = currentSnapshot;
    persistQueueSnapshot(resumableItems);
  }, [queue]);

  useEffect(() => {
    if (queue.length === 0) {
      setShowQueueResumePrompt(false);
      setRestoredQueueItemsCount(0);
      setDuplicateFilesSkipped(0);
    }
  }, [queue.length]);

  useEffect(() => {
    return () => {
      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
        progressUnsubscribeRef.current = null;
      }
      if (etaIntervalRef.current !== null) {
        clearInterval(etaIntervalRef.current);
        etaIntervalRef.current = null;
      }
    };
  }, []);

  const updateEstimatedTimeRemaining = useCallback(() => {
    if (isCancelledRef.current) {
      return;
    }

    const remainingMs = calculateEtaMs({
      currentItem: currentProcessingItemRef.current,
      currentItemStartTimeMs: currentItemStartTimeRef.current,
      progressPercent: lastProgressPercentRef.current,
      remainingItems: remainingItemsRef.current,
      samples: etaSamplesRef.current,
      nowMs: Date.now(),
    });

    setEstimatedTimeRemainingSec(toEstimatedSeconds(remainingMs));
  }, []);

  useEffect(() => {
    if (!isProcessing) {
      if (etaIntervalRef.current !== null) {
        clearInterval(etaIntervalRef.current);
        etaIntervalRef.current = null;
      }
      return;
    }

    etaIntervalRef.current = setInterval(() => {
      updateEstimatedTimeRemaining();
    }, 1000);

    return () => {
      if (etaIntervalRef.current !== null) {
        clearInterval(etaIntervalRef.current);
        etaIntervalRef.current = null;
      }
    };
  }, [isProcessing, updateEstimatedTimeRemaining]);

  const addFiles = useCallback((files: SelectedFile[]) => {
    const existingKeys = new Set(queueRef.current.map((item) => getFileIdentityKey(item.file)));
    const duplicateFiles: SelectedFile[] = [];

    const newItems: QueueItem[] = files.reduce<QueueItem[]>((items, file) => {
      const identityKey = getFileIdentityKey(file);
      if (existingKeys.has(identityKey)) {
        duplicateFiles.push(file);
        return items;
      }

      existingKeys.add(identityKey);
      items.push({
        id: generateId(),
        file,
        status: 'pending' as QueueItemStatus,
        progress: { percent: 0, status: '' },
      });
      return items;
    }, []);

    if (newItems.length > 0) {
      shouldPersistQueueRef.current = true;
      queueRef.current = [...queueRef.current, ...newItems];
      setQueue((prev) => [...prev, ...newItems]);
      logger.info('Added files to batch queue', {
        count: newItems.length,
        files: newItems.map((item) => item.file.name),
      });
    }

    setDuplicateFilesSkipped(duplicateFiles.length);

    if (duplicateFiles.length > 0) {
      logger.warn('Skipped duplicate files in batch queue', {
        count: duplicateFiles.length,
        files: duplicateFiles.map((file) => file.name),
      });
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    shouldPersistQueueRef.current = true;
    setQueue((prev) => prev.filter((item) => item.id !== id));
    logger.info('Removed file from batch queue', { id });
  }, []);

  const clearCompleted = useCallback(() => {
    shouldPersistQueueRef.current = true;
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
    shouldPersistQueueRef.current = true;
    setQueue([]);
    setShowQueueResumePrompt(false);
    setRestoredQueueItemsCount(0);
    logger.info('Cleared all items from batch queue');
  }, [isProcessing]);

  const dismissQueueResumePrompt = useCallback(() => {
    setShowQueueResumePrompt(false);
    setRestoredQueueItemsCount(0);
  }, []);

  const processItem = useCallback(
    async (item: QueueItem): Promise<QueueItem> => {
      const startTime = Date.now();

      shouldPersistQueueRef.current = true;
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'processing' as QueueItemStatus, startTime } : q
        )
      );
      setCurrentItemId(item.id);
      currentProcessingItemRef.current = item;
      currentItemStartTimeRef.current = startTime;

      if (progressUnsubscribeRef.current) {
        progressUnsubscribeRef.current();
        progressUnsubscribeRef.current = null;
      }

      lastProgressPercentRef.current = 0;
      updateEstimatedTimeRemaining();

      progressUnsubscribeRef.current = onTranscriptionProgress((progress) => {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, progress } : q)));

        const startTimeMs = currentItemStartTimeRef.current;
        const progressPercent = Number(progress.percent);

        if (
          isCancelledRef.current ||
          startTimeMs === null ||
          !Number.isFinite(progressPercent) ||
          progressPercent <= 0 ||
          progressPercent > 100
        ) {
          return;
        }

        lastProgressPercentRef.current = progressPercent;
        updateEstimatedTimeRemaining();
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
            startTime,
            status: 'cancelled',
            endTime,
          };
        }

        if (!result || result.error || !result.success) {
          const error = result?.error || 'Transcription failed';
          logger.error('Batch item failed', { id: item.id, error });
          return {
            ...item,
            startTime,
            status: 'error',
            error: toUserFriendlyTranscriptionError(error),
            endTime,
          };
        }

        if (result.cancelled) {
          return {
            ...item,
            startTime,
            status: 'cancelled',
            endTime,
          };
        }

        if (!result.text) {
          return {
            ...item,
            startTime,
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
          onFirstComplete(item.id, result.text, item.file);
        }

        return {
          ...item,
          startTime,
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
          startTime,
          status: 'error',
          error: toUserFriendlyTranscriptionError(error),
          endTime: Date.now(),
        };
      } finally {
        if (progressUnsubscribeRef.current) {
          progressUnsubscribeRef.current();
          progressUnsubscribeRef.current = null;
        }
      }
    },
    [settings, onHistoryAdd, onFirstComplete, updateEstimatedTimeRemaining]
  );

  const runProcessing = useCallback(
    async (targetStatuses: QueueItemStatus[], noItemsLogMessage: string) => {
      if (isProcessing) return;

      const itemsToProcess = queue.filter((item) => targetStatuses.includes(item.status));

      if (itemsToProcess.length === 0) {
        logger.warn(noItemsLogMessage);
        return;
      }

      const activeIds = new Set(itemsToProcess.map((item) => item.id));
      activeRunItemIdsRef.current = activeIds;
      etaSamplesRef.current = [];
      remainingItemsRef.current = itemsToProcess;
      currentProcessingItemRef.current = null;
      currentItemStartTimeRef.current = null;
      lastProgressPercentRef.current = 0;
      setEstimatedTimeRemainingSec(null);

      shouldPersistQueueRef.current = true;
      setQueue((prev) =>
        prev.map((item) =>
          activeIds.has(item.id) && (item.status === 'cancelled' || item.status === 'error')
            ? {
                ...item,
                status: 'pending' as QueueItemStatus,
                error: undefined,
                endTime: undefined,
              }
            : item
        )
      );

      setIsProcessing(true);
      isCancelledRef.current = false;
      hasCalledFirstCompleteRef.current = false;

      logger.info('Starting batch processing', { count: itemsToProcess.length });

      const processedItems: QueueItem[] = [];

      for (let index = 0; index < itemsToProcess.length; index++) {
        const item = itemsToProcess[index];
        if (!item) continue;

        if (isCancelledRef.current) {
          shouldPersistQueueRef.current = true;
          setQueue((prev) =>
            prev.map((q) =>
              q.status === 'pending' && activeIds.has(q.id)
                ? { ...q, status: 'cancelled' as QueueItemStatus }
                : q
            )
          );
          break;
        }

        const resetItem = { ...item, status: 'pending' as QueueItemStatus, error: undefined };
        remainingItemsRef.current = itemsToProcess.slice(index + 1);
        const processedItem = await processItem(resetItem);
        currentProcessingItemRef.current = null;
        currentItemStartTimeRef.current = null;
        lastProgressPercentRef.current = 0;
        processedItems.push(processedItem);
        shouldPersistQueueRef.current = true;
        setQueue((prev) => prev.map((q) => (q.id === processedItem.id ? processedItem : q)));

        if (
          processedItem.status === 'completed' &&
          typeof processedItem.startTime === 'number' &&
          typeof processedItem.endTime === 'number' &&
          processedItem.endTime >= processedItem.startTime
        ) {
          etaSamplesRef.current = [
            ...etaSamplesRef.current,
            {
              durationMs: processedItem.endTime - processedItem.startTime,
              fileSize: getPositiveNumber(processedItem.file.size) ?? undefined,
            },
          ];
        }

        updateEstimatedTimeRemaining();
      }

      const wasCancelled = isCancelledRef.current;
      setIsProcessing(false);
      setCurrentItemId(null);
      activeRunItemIdsRef.current = new Set();
      currentItemStartTimeRef.current = null;
      currentProcessingItemRef.current = null;
      remainingItemsRef.current = [];
      lastProgressPercentRef.current = 0;
      setEstimatedTimeRemainingSec(null);

      if (!wasCancelled) {
        showBatchCompletionNotification(processedItems);
      }

      logger.info('Batch processing complete');
    },
    [isProcessing, queue, processItem, updateEstimatedTimeRemaining]
  );

  const startProcessing = useCallback(async () => {
    dismissQueueResumePrompt();
    await runProcessing(['pending', 'cancelled', 'error'], 'No items to process');
  }, [dismissQueueResumePrompt, runProcessing]);

  const retryFailed = useCallback(async () => {
    dismissQueueResumePrompt();
    await runProcessing(['cancelled', 'error'], 'No failed items to retry');
  }, [dismissQueueResumePrompt, runProcessing]);

  const resumePersistedQueue = useCallback(async () => {
    await startProcessing();
  }, [startProcessing]);

  const cancelProcessing = useCallback(async () => {
    if (!isProcessing) return;

    isCancelledRef.current = true;
    await cancelTranscription();

    setIsProcessing(false);
    setCurrentItemId(null);
    currentItemStartTimeRef.current = null;
    currentProcessingItemRef.current = null;
    remainingItemsRef.current = [];
    lastProgressPercentRef.current = 0;
    setEstimatedTimeRemainingSec(null);

    shouldPersistQueueRef.current = true;
    setQueue((prev) =>
      prev.map((q) =>
        q.status === 'processing' ||
        (q.status === 'pending' && activeRunItemIdsRef.current.has(q.id))
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
    duplicateFilesSkipped,
    estimatedTimeRemainingSec,
    showQueueResumePrompt,
    restoredQueueItemsCount,

    addFiles,
    removeFile,
    clearCompleted,
    clearAll,
    dismissQueueResumePrompt,
    resumePersistedQueue,

    startProcessing,
    retryFailed,
    cancelProcessing,

    getCompletedTranscription,
  };
}
