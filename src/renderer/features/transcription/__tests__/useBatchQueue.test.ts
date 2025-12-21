import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBatchQueue } from '../hooks/useBatchQueue';
import { overrideElectronAPI } from '@/test/utils';
import type {
  TranscriptionSettings,
  SelectedFile,
  TranscriptionResult,
  TranscriptionProgress,
} from '@/types';

describe('useBatchQueue', () => {
  const mockSettings: TranscriptionSettings = {
    model: 'base',
    language: 'en',
  };

  const mockOnHistoryAdd = vi.fn();
  const mockOnFirstComplete = vi.fn();

  const createMockSelectedFile = (name: string): SelectedFile => ({
    name,
    path: `/path/to/${name}`,
    size: 1024,
  });

  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('initialization', () => {
    it('should initialize with empty queue', () => {
      const { result } = renderHook(() => useBatchQueue({ settings: mockSettings }));

      expect(result.current.queue).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.currentItemId).toBe(null);
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
        'Transcribed text'
      );
    });

    it('should not start if already processing', async () => {
      const startTranscriptionMock = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  text: 'text',
                }),
              100
            )
          )
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

      act(() => {
        result.current.startProcessing();
      });

      expect(result.current.isProcessing).toBe(true);

      act(() => {
        result.current.startProcessing();
      });

      expect(startTranscriptionMock).toHaveBeenCalledTimes(1);
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
});
