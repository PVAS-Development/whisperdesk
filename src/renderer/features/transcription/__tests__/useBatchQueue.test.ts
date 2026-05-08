import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBatchQueue } from '../hooks/useBatchQueue';
import { overrideElectronAPI } from '@/test/utils';
import type {
  TranscriptionSettings,
  SelectedFile,
  TranscriptionResult,
  TranscriptionProgress,
} from '@/types';
import { logger } from '@/services/logger';

describe('useBatchQueue', () => {
  const originalNotification = globalThis.Notification;
  const QUEUE_STORAGE_KEY = 'whisperdesk_queue';

  const mockSettings: TranscriptionSettings = {
    model: 'base',
    language: 'en',
  };

  const mockOnHistoryAdd = vi.fn();
  const mockOnFirstComplete = vi.fn();

  const createMockSelectedFile = (
    name: string,
    overrides: Partial<SelectedFile> = {}
  ): SelectedFile => ({
    name,
    path: `/path/to/${name}`,
    size: 1024,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    overrideElectronAPI({
      startTranscription: vi.fn().mockResolvedValue({
        success: true,
        text: 'Transcribed text',
        duration: 10,
        language: 'en',
      }),
      cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
      onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
    });
  });

  afterEach(() => {
    if (originalNotification) {
      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        writable: true,
        value: originalNotification,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'Notification');
    }
  });

  const mockNotificationApi = (permission: NotificationPermission = 'granted') => {
    const notificationSpy = vi.fn();
    const requestPermissionSpy = vi.fn().mockResolvedValue(permission);

    class MockNotification {
      static permission: NotificationPermission = permission;
      static requestPermission = requestPermissionSpy;

      constructor(title: string, options?: NotificationOptions) {
        notificationSpy({ title, options });
      }
    }

    Object.defineProperty(globalThis, 'Notification', {
      configurable: true,
      writable: true,
      value: MockNotification,
    });

    return { notificationSpy, requestPermissionSpy };
  };

  describe('initialization', () => {
    it('should initialize with empty queue', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      expect(result.current.queue).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentItemId).toBe(null);
      expect(result.current.estimatedTimeRemainingSec).toBeNull();
      expect(result.current.showQueueResumePrompt).toBe(false);
      expect(result.current.restoredQueueItemsCount).toBe(0);
    });

    it('should restore persisted queue and normalize processing items to pending', () => {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify([
          {
            id: 'pending-1',
            file: { name: 'pending.mp3', path: '/path/to/pending.mp3', size: 1024 },
            status: 'pending',
          },
          {
            id: 'processing-1',
            file: { name: 'processing.mp3', path: '/path/to/processing.mp3' },
            status: 'processing',
          },
          {
            id: 'error-1',
            file: { name: 'error.mp3', path: '/path/to/error.mp3' },
            status: 'error',
            error: 'Failed previously',
          },
          {
            id: 'invalid-1',
            file: { name: 'invalid.mp3', path: '/path/to/invalid.mp3' },
            status: 'completed',
          },
        ])
      );

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      expect(result.current.queue).toHaveLength(3);
      expect(result.current.queue[0]).toMatchObject({
        id: 'pending-1',
        status: 'pending',
        progress: { percent: 0, status: '' },
      });
      expect(result.current.queue[1]).toMatchObject({
        id: 'processing-1',
        status: 'pending',
        progress: { percent: 0, status: '' },
      });
      expect(result.current.queue[2]).toMatchObject({
        id: 'error-1',
        status: 'error',
        error: 'Failed previously',
      });
      expect(result.current.showQueueResumePrompt).toBe(true);
      expect(result.current.restoredQueueItemsCount).toBe(3);
    });

    it('should ignore corrupted persisted queue data', () => {
      localStorage.setItem(QUEUE_STORAGE_KEY, 'not-json');

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      expect(result.current.queue).toEqual([]);
      expect(result.current.showQueueResumePrompt).toBe(false);
      expect(result.current.restoredQueueItemsCount).toBe(0);
    });
  });

  describe('addFiles', () => {
    it('should add files to queue', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      const files = [createMockSelectedFile('audio1.mp3'), createMockSelectedFile('audio2.mp3')];

      act(() => {
        result.current.addFiles(files);
      });

      expect(result.current.queue).toHaveLength(2);
      expect(result.current.queue[0]!.file.name).toBe('audio1.mp3');
      expect(result.current.queue[1]!.file.name).toBe('audio2.mp3');
      expect(result.current.queue[0]!.status).toBe('pending');
    });

    it('should generate unique IDs for each item', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      const files = [createMockSelectedFile('audio1.mp3'), createMockSelectedFile('audio2.mp3')];

      act(() => {
        result.current.addFiles(files);
      });

      const ids = result.current.queue.map((item) => item.id);
      expect(new Set(ids).size).toBe(2);
    });

    it('should skip duplicate file paths and expose skipped count', () => {
      const warnSpy = vi.spyOn(logger, 'warn');
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      const duplicateFile = createMockSelectedFile('audio1.mp3');
      const newFile = createMockSelectedFile('audio2.mp3');

      act(() => {
        result.current.addFiles([duplicateFile]);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.duplicateFilesSkipped).toBe(0);

      act(() => {
        result.current.addFiles([duplicateFile, newFile, duplicateFile]);
      });

      expect(result.current.queue).toHaveLength(2);
      expect(result.current.queue[0]!.file.path).toBe('/path/to/audio1.mp3');
      expect(result.current.queue[1]!.file.path).toBe('/path/to/audio2.mp3');
      expect(result.current.duplicateFilesSkipped).toBe(2);
      expect(warnSpy).toHaveBeenCalledWith('Skipped duplicate files in batch queue', {
        count: 2,
        files: ['audio1.mp3', 'audio1.mp3'],
      });
    });

    it('should detect duplicates against restored queue before effects run', () => {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify([
          {
            id: 'restored-1',
            file: { name: 'audio1.mp3', path: '/path/to/audio1.mp3', size: 1024 },
            status: 'pending',
          },
        ])
      );

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.duplicateFilesSkipped).toBe(1);
    });

    it('should skip content duplicates using fingerprint even with different file paths', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      const fingerprint = 'shared-fingerprint';
      const originalFile = createMockSelectedFile('audio1.mp3', {
        path: '/desktop/audio1.mp3',
        fingerprint,
      });
      const copiedFile = createMockSelectedFile('audio1 copy.mp3', {
        path: '/desktop/audio1 copy.mp3',
        fingerprint,
      });

      act(() => {
        result.current.addFiles([originalFile, copiedFile]);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]!.file.path).toBe('/desktop/audio1.mp3');
      expect(result.current.duplicateFilesSkipped).toBe(1);
    });

    it('should reset duplicate count when no duplicates are skipped', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      expect(result.current.duplicateFilesSkipped).toBe(1);

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio2.mp3')]);
      });

      expect(result.current.duplicateFilesSkipped).toBe(0);
    });
  });

  describe('removeFile', () => {
    it('should remove file from queue by id', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      const idToRemove = result.current.queue[0]!.id;

      act(() => {
        result.current.removeFile(idToRemove);
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0]!.file.name).toBe('audio2.mp3');
    });

    it('should clear duplicate skipped badge count when queue becomes empty', async () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      expect(result.current.duplicateFilesSkipped).toBe(1);

      const idToRemove = result.current.queue[0]!.id;
      act(() => {
        result.current.removeFile(idToRemove);
      });

      expect(result.current.queue).toHaveLength(0);

      await waitFor(() => {
        expect(result.current.duplicateFilesSkipped).toBe(0);
      });
    });
  });

  describe('clearCompleted', () => {
    it('should clear completed and cancelled items', async () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('completed');

      act(() => {
        result.current.clearCompleted();
      });

      expect(result.current.queue).toHaveLength(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all items when not processing', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.queue).toHaveLength(0);
    });

    it('should not clear items while processing', async () => {
      const warnSpy = vi.spyOn(logger, 'warn');
      const pendingPromise = new Promise(() => {});

      overrideElectronAPI({
        startTranscription: vi.fn().mockReturnValue(pendingPromise),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      act(() => {
        result.current.startProcessing();
      });

      expect(result.current.isProcessing).toBe(true);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.queue).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalledWith('Cannot clear queue while processing');
    });
  });

  describe('queue persistence and resume', () => {
    it('should persist resumable queue items to localStorage', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      const saved = JSON.parse(localStorage.getItem(QUEUE_STORAGE_KEY) || '[]');
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({
        file: {
          name: 'audio1.mp3',
          path: '/path/to/audio1.mp3',
        },
        status: 'pending',
      });
    });

    it('should clear persisted queue when all items are completed', async () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      expect(localStorage.getItem(QUEUE_STORAGE_KEY)).not.toBeNull();

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(localStorage.getItem(QUEUE_STORAGE_KEY)).toBeNull();
    });

    it('should dismiss resume prompt without changing restored queue', () => {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify([
          {
            id: 'restored-1',
            file: { name: 'restored.mp3', path: '/path/to/restored.mp3' },
            status: 'pending',
          },
        ])
      );

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      expect(result.current.showQueueResumePrompt).toBe(true);
      expect(result.current.queue).toHaveLength(1);

      act(() => {
        result.current.dismissQueueResumePrompt();
      });

      expect(result.current.showQueueResumePrompt).toBe(false);
      expect(result.current.restoredQueueItemsCount).toBe(0);
      expect(result.current.queue).toHaveLength(1);
    });

    it('should resume restored queue and hide resume prompt', async () => {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify([
          {
            id: 'restored-1',
            file: { name: 'restored.mp3', path: '/path/to/restored.mp3' },
            status: 'pending',
          },
        ])
      );

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      expect(result.current.showQueueResumePrompt).toBe(true);

      await act(async () => {
        await result.current.resumePersistedQueue();
      });

      expect(result.current.showQueueResumePrompt).toBe(false);
      expect(result.current.restoredQueueItemsCount).toBe(0);
      expect(result.current.queue[0]!.status).toBe('completed');
    });

    it('should not persist queue again on progress-only updates', async () => {
      let progressCallback: ((progress: TranscriptionProgress) => void) | undefined;
      let resolveTranscription: ((value: TranscriptionResult) => void) | undefined;

      overrideElectronAPI({
        startTranscription: vi.fn().mockImplementation(
          () =>
            new Promise<TranscriptionResult>((resolve) => {
              resolveTranscription = resolve;
            })
        ),
        cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
        onTranscriptionProgress: vi.fn().mockImplementation((callback) => {
          progressCallback = callback;
          return () => {};
        }),
      });

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      act(() => {
        void result.current.startProcessing();
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(true);
      });

      const writesBeforeProgress = setItemSpy.mock.calls.length;

      act(() => {
        progressCallback?.({ percent: 15, status: 'Transcribing... 15%' });
        progressCallback?.({ percent: 32, status: 'Transcribing... 32%' });
        progressCallback?.({ percent: 58, status: 'Transcribing... 58%' });
      });

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledTimes(writesBeforeProgress);
      });

      act(() => {
        resolveTranscription?.({ success: true, text: 'Transcribed text' });
      });

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false);
      });
    });
  });

  describe('startProcessing', () => {
    it('should process pending items sequentially', async () => {
      const { result } = renderHook(() =>
        useBatchQueue({
          settings: mockSettings,
          onHistoryAdd: mockOnHistoryAdd,
        })
      );

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('completed');
      expect(result.current.queue[1]!.status).toBe('completed');
      expect(result.current.isProcessing).toBe(false);
    });

    it('should call onHistoryAdd for completed items', async () => {
      const { result } = renderHook(() =>
        useBatchQueue({
          settings: mockSettings,
          onHistoryAdd: mockOnHistoryAdd,
        })
      );

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(mockOnHistoryAdd).toHaveBeenCalledTimes(1);
      expect(mockOnHistoryAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: 'audio1.mp3',
          fullText: 'Transcribed text',
        })
      );
    });

    it('should call onFirstComplete for first completed item', async () => {
      const { result } = renderHook(() =>
        useBatchQueue({
          settings: mockSettings,
          onFirstComplete: mockOnFirstComplete,
        })
      );

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(mockOnFirstComplete).toHaveBeenCalledTimes(1);
      expect(mockOnFirstComplete).toHaveBeenCalledWith(
        result.current.queue[0]!.id,
        'Transcribed text',
        expect.objectContaining({
          name: 'audio1.mp3',
          path: '/path/to/audio1.mp3',
        })
      );
    });

    it('should not start if already processing', async () => {
      let resolveTranscription: ((value: TranscriptionResult) => void) | undefined;
      const startTranscriptionMock = vi.fn().mockImplementation(
        () =>
          new Promise<TranscriptionResult>((resolve) => {
            resolveTranscription = resolve;
          })
      );

      overrideElectronAPI({
        startTranscription: startTranscriptionMock,
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      expect(result.current.isProcessing).toBe(true);

      act(() => {
        result.current.startProcessing();
      });

      expect(startTranscriptionMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveTranscription?.({ success: true, text: 'text' });
        await processingPromise;
      });
    });

    it('should handle transcription errors', async () => {
      overrideElectronAPI({
        startTranscription: vi.fn().mockResolvedValue({
          success: false,
          error: 'Transcription failed',
        }),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('error');
      expect(result.current.queue[0]!.error).toBe('Transcription failed');
    });

    it('should map FFmpeg no-audio errors to a friendly message', async () => {
      overrideElectronAPI({
        startTranscription: vi.fn().mockResolvedValue({
          success: false,
          error: 'FFmpeg conversion failed: Output file does not contain any stream',
        }),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('video-only.mov')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('error');
      expect(result.current.queue[0]!.error).toBe(
        'No audio track found in this file. Please choose a file that contains audio.'
      );
    });

    it('should handle cancelled result from transcription', async () => {
      overrideElectronAPI({
        startTranscription: vi.fn().mockResolvedValue({
          success: true,
          cancelled: true,
        }),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('cancelled');
    });

    it('should handle empty text result from transcription', async () => {
      overrideElectronAPI({
        startTranscription: vi.fn().mockResolvedValue({
          success: true,
          text: '',
        }),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('error');
      expect(result.current.queue[0]!.error).toBe('Transcription produced no output');
    });

    it('should handle thrown non-Error object', async () => {
      overrideElectronAPI({
        startTranscription: vi.fn().mockRejectedValue('string error'),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('error');
      expect(result.current.queue[0]!.error).toBe('Unknown error');
    });

    it('should not process if no pending items', async () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('should expose estimated time remaining while processing subsequent items', async () => {
      let now = 1000;
      const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      let resolveSecond: ((value: TranscriptionResult) => void) | undefined;
      const startTranscriptionMock = vi
        .fn()
        .mockImplementationOnce(async () => {
          now = 6000;
          return { success: true, text: 'first' };
        })
        .mockImplementationOnce(
          () =>
            new Promise<TranscriptionResult>((resolve) => {
              resolveSecond = resolve;
            })
        );

      overrideElectronAPI({
        startTranscription: startTranscriptionMock,
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      await waitFor(() => {
        expect(result.current.estimatedTimeRemainingSec).toBe(5);
      });

      await act(async () => {
        now = 11000;
        resolveSecond?.({ success: true, text: 'second' });
        await processingPromise;
      });

      expect(result.current.estimatedTimeRemainingSec).toBeNull();
      nowSpy.mockRestore();
    });

    it('should estimate remaining time from current item progress before first completion', async () => {
      let now = 1000;
      const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      let progressCb: ((progress: TranscriptionProgress) => void) | undefined;
      let resolveTranscription: ((value: TranscriptionResult) => void) | undefined;

      overrideElectronAPI({
        startTranscription: vi.fn().mockImplementation(
          () =>
            new Promise<TranscriptionResult>((resolve) => {
              resolveTranscription = resolve;
            })
        ),
        onTranscriptionProgress: (cb) => {
          progressCb = cb;
          return () => {};
        },
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
          createMockSelectedFile('audio3.mp3'),
        ]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      act(() => {
        now = 2000;
        progressCb?.({ percent: 50, status: 'Halfway' });
      });

      expect(result.current.estimatedTimeRemainingSec).toBe(5);

      await act(async () => {
        now = 3000;
        resolveTranscription?.({ success: true, text: 'done' });
        await result.current.cancelProcessing();
        await processingPromise;
      });

      nowSpy.mockRestore();
    });

    it('should scale eta for remaining files by completed item size and duration', async () => {
      let now = 1000;
      const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      let resolveSecond: ((value: TranscriptionResult) => void) | undefined;
      const startTranscriptionMock = vi
        .fn()
        .mockImplementationOnce(async () => {
          now = 6000;
          return { success: true, text: 'first' };
        })
        .mockImplementationOnce(
          () =>
            new Promise<TranscriptionResult>((resolve) => {
              resolveSecond = resolve;
            })
        );

      overrideElectronAPI({
        startTranscription: startTranscriptionMock,
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('short.mp3', { size: 1000 }),
          createMockSelectedFile('long.mp3', { size: 2000 }),
        ]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      await waitFor(() => {
        expect(result.current.estimatedTimeRemainingSec).toBe(10);
      });

      await act(async () => {
        now = 16000;
        resolveSecond?.({ success: true, text: 'second' });
        await processingPromise;
      });

      nowSpy.mockRestore();
    });

    it('should scale pending eta from current progress when no item has completed yet', async () => {
      let now = 1000;
      const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      let progressCb: ((progress: TranscriptionProgress) => void) | undefined;
      let resolveTranscription: ((value: TranscriptionResult) => void) | undefined;

      overrideElectronAPI({
        startTranscription: vi.fn().mockImplementation(
          () =>
            new Promise<TranscriptionResult>((resolve) => {
              resolveTranscription = resolve;
            })
        ),
        onTranscriptionProgress: (cb) => {
          progressCb = cb;
          return () => {};
        },
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('current.mp3', { size: 1000 }),
          createMockSelectedFile('long.mp3', { size: 2000 }),
          createMockSelectedFile('short.mp3', { size: 500 }),
        ]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      act(() => {
        now = 2000;
        progressCb?.({ percent: 50, status: 'Halfway' });
      });

      expect(result.current.estimatedTimeRemainingSec).toBe(6);

      await act(async () => {
        now = 3000;
        resolveTranscription?.({ success: true, text: 'done' });
        await result.current.cancelProcessing();
        await processingPromise;
      });

      nowSpy.mockRestore();
    });
  });

  describe('cancelProcessing', () => {
    it('should cancel processing and mark items as cancelled', async () => {
      const pendingPromise = new Promise(() => {});

      overrideElectronAPI({
        startTranscription: vi.fn().mockReturnValue(pendingPromise),
        cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      act(() => {
        result.current.startProcessing();
      });

      await act(async () => {
        await result.current.cancelProcessing();
      });

      expect(result.current.isProcessing).toBe(false);
      expect(result.current.queue.every((item) => item.status === 'cancelled')).toBe(true);
    });

    it('should do nothing if not processing', async () => {
      const cancelMock = vi.fn().mockResolvedValue({ success: true });
      overrideElectronAPI({
        cancelTranscription: cancelMock,
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      await act(async () => {
        await result.current.cancelProcessing();
      });

      expect(cancelMock).not.toHaveBeenCalled();
    });
  });

  describe('getCompletedTranscription', () => {
    it('should return transcription text for completed item', async () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      const id = result.current.queue[0]!.id;
      const text = result.current.getCompletedTranscription(id);

      expect(text).toBe('Transcribed text');
    });

    it('should return undefined for non-completed item', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      const id = result.current.queue[0]!.id;
      const text = result.current.getCompletedTranscription(id);

      expect(text).toBeUndefined();
    });

    it('should return undefined for non-existent item', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      const text = result.current.getCompletedTranscription('non-existent-id');

      expect(text).toBeUndefined();
    });
  });

  describe('retry functionality', () => {
    it('should reset cancelled items to pending when starting processing', async () => {
      const firstPromise = new Promise(() => {});

      overrideElectronAPI({
        startTranscription: vi
          .fn()
          .mockReturnValueOnce(firstPromise)
          .mockResolvedValue({ success: true, text: 'text' }),
        cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      act(() => {
        result.current.startProcessing();
      });

      await act(async () => {
        await result.current.cancelProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('cancelled');

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('completed');
    });

    it('should retry only failed and cancelled items', async () => {
      const startTranscriptionMock = vi
        .fn()
        .mockResolvedValueOnce({ success: false, error: 'First failed' })
        .mockResolvedValueOnce({ success: true, cancelled: true })
        .mockResolvedValueOnce({ success: true, text: 'third-complete' })
        .mockResolvedValueOnce({ success: true, text: 'retry-first' })
        .mockResolvedValueOnce({ success: true, text: 'retry-second' });

      overrideElectronAPI({
        startTranscription: startTranscriptionMock,
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
          createMockSelectedFile('audio3.mp3'),
        ]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(result.current.queue[0]!.status).toBe('error');
      expect(result.current.queue[1]!.status).toBe('cancelled');
      expect(result.current.queue[2]!.status).toBe('completed');

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio4.mp3')]);
      });

      expect(result.current.queue[3]!.status).toBe('pending');

      await act(async () => {
        await result.current.retryFailed();
      });

      expect(startTranscriptionMock).toHaveBeenCalledTimes(5);
      expect(result.current.queue[0]!.status).toBe('completed');
      expect(result.current.queue[1]!.status).toBe('completed');
      expect(result.current.queue[2]!.status).toBe('completed');
      expect(result.current.queue[3]!.status).toBe('pending');
    });

    it('should not retry pending items when using retryFailed', async () => {
      const startTranscriptionMock = vi.fn().mockResolvedValue({ success: true, text: 'text' });
      overrideElectronAPI({
        startTranscription: startTranscriptionMock,
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.retryFailed();
      });

      expect(startTranscriptionMock).not.toHaveBeenCalled();
      expect(result.current.queue[0]!.status).toBe('pending');
    });
  });

  describe('progress and cancellation flow', () => {
    it('should update item progress during processing', async () => {
      let progressCb: ((progress: TranscriptionProgress) => void) | undefined;
      let resolveTranscription: (val: TranscriptionResult) => void = () => {};
      const startPromise = new Promise<TranscriptionResult>((resolve) => {
        resolveTranscription = resolve;
      });

      overrideElectronAPI({
        startTranscription: vi.fn().mockReturnValue(startPromise),
        onTranscriptionProgress: (cb) => {
          progressCb = cb;
          return () => {};
        },
        cancelTranscription: vi.fn(),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      act(() => {
        if (progressCb) {
          progressCb({ percent: 50, status: 'Halfway' });
        }
      });

      expect(result.current.queue[0]!.progress.percent).toBe(50);
      expect(result.current.queue[0]!.progress.status).toBe('Halfway');

      await act(async () => {
        resolveTranscription({ success: true, text: 'Done' });
        await processingPromise;
      });

      expect(result.current.queue[0]!.status).toBe('completed');
    });

    it('should stop sequence and mark pending items as cancelled when main cancellation occurs', async () => {
      let resolveTranscription: (val: TranscriptionResult) => void = () => {};
      const startPromise = new Promise<TranscriptionResult>((resolve) => {
        resolveTranscription = resolve;
      });

      overrideElectronAPI({
        startTranscription: vi.fn().mockReturnValue(startPromise),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
        cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      expect(result.current.isProcessing).toBe(true);
      expect(result.current.queue[0]!.status).toBe('processing');

      await act(async () => {
        await result.current.cancelProcessing();
      });

      await act(async () => {
        resolveTranscription({ success: true, text: 'Done' });
        await processingPromise;
      });

      expect(result.current.queue[0]!.status).toBe('cancelled');

      expect(result.current.queue[1]!.status).toBe('cancelled');
    });
  });

  describe('completion notifications', () => {
    it('should notify once when processing completes and permission is granted', async () => {
      const { notificationSpy } = mockNotificationApi('granted');

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([
          createMockSelectedFile('audio1.mp3'),
          createMockSelectedFile('audio2.mp3'),
        ]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(notificationSpy).toHaveBeenCalledTimes(1);
      expect(notificationSpy).toHaveBeenCalledWith({
        title: 'Batch transcription complete',
        options: { body: '2 completed' },
      });
    });

    it('should request permission and notify when permission starts as default', async () => {
      const { notificationSpy, requestPermissionSpy } = mockNotificationApi('default');
      requestPermissionSpy.mockResolvedValueOnce('granted');

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      await waitFor(() => {
        expect(requestPermissionSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith({
          title: 'Transcription complete',
          options: { body: '1 completed' },
        });
      });
    });

    it('should not notify if permission is denied after requesting', async () => {
      const { notificationSpy, requestPermissionSpy } = mockNotificationApi('default');
      requestPermissionSpy.mockResolvedValueOnce('denied');

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      await waitFor(() => {
        expect(requestPermissionSpy).toHaveBeenCalledTimes(1);
      });
      expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('should not notify when processing was cancelled', async () => {
      const { notificationSpy } = mockNotificationApi('granted');
      let resolveTranscription: ((value: TranscriptionResult) => void) | undefined;

      overrideElectronAPI({
        startTranscription: vi.fn().mockImplementation(
          () =>
            new Promise<TranscriptionResult>((resolve) => {
              resolveTranscription = resolve;
            })
        ),
        cancelTranscription: vi.fn().mockResolvedValue({ success: true }),
        onTranscriptionProgress: vi.fn().mockReturnValue(() => {}),
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));
      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      let processingPromise: Promise<void>;
      act(() => {
        processingPromise = result.current.startProcessing();
      });

      await act(async () => {
        await result.current.cancelProcessing();
      });

      await act(async () => {
        resolveTranscription?.({ success: true, text: 'Done' });
        await processingPromise;
      });

      expect(notificationSpy).not.toHaveBeenCalled();
    });

    it('should log warning when notification creation throws', async () => {
      const requestPermissionSpy = vi.fn().mockResolvedValue('granted');

      class MockNotification {
        static permission: NotificationPermission = 'granted';
        static requestPermission = requestPermissionSpy;

        constructor() {
          throw new Error('constructor failed');
        }
      }

      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));
      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(logger.warn).toHaveBeenCalledWith('Failed to create completion notification', {
        error: 'constructor failed',
      });
    });

    it('should log warning when notification permission lookup throws', async () => {
      class MockNotification {
        static get permission(): NotificationPermission {
          throw new Error('permission failed');
        }

        static requestPermission = vi.fn().mockResolvedValue('granted');

        constructor() {}
      }

      Object.defineProperty(globalThis, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });

      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));
      act(() => {
        result.current.addFiles([createMockSelectedFile('audio1.mp3')]);
      });

      await act(async () => {
        await result.current.startProcessing();
      });

      expect(logger.warn).toHaveBeenCalledWith('Failed to show completion notification', {
        error: 'permission failed',
      });
    });
  });
});
