import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from '../useCopyToClipboard';

describe('useCopyToClipboard', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  describe('initialization', () => {
    it('should initialize with copySuccess as false', () => {
      const { result } = renderHook(() => useCopyToClipboard());
      expect(result.current.copySuccess).toBe(false);
    });

    it('should return copyToClipboard function', () => {
      const { result } = renderHook(() => useCopyToClipboard());
      expect(typeof result.current.copyToClipboard).toBe('function');
    });

    it('should return resetCopySuccess function', () => {
      const { result } = renderHook(() => useCopyToClipboard());
      expect(typeof result.current.resetCopySuccess).toBe('function');
    });
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard and set copySuccess to true', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.copyToClipboard('Hello World');
      });

      expect(success).toBe(true);
      expect(result.current.copySuccess).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Hello World');
    });

    it('should return false and not set copySuccess for empty text', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.copyToClipboard('');
      });

      expect(success).toBe(false);
      expect(result.current.copySuccess).toBe(false);
    });

    it('should reset copySuccess after successDuration', async () => {
      const { result } = renderHook(() => useCopyToClipboard(1000));

      await act(async () => {
        await result.current.copyToClipboard('Test');
      });

      expect(result.current.copySuccess).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.copySuccess).toBe(false);
    });

    it('should return false when clipboard.writeText fails', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          clipboard: {
            writeText: vi.fn().mockRejectedValue(new Error('Failed')),
          },
        },
        writable: true,
      });

      const { result } = renderHook(() => useCopyToClipboard());

      let success: boolean = false;
      await act(async () => {
        success = await result.current.copyToClipboard('Hello');
      });

      expect(success).toBe(false);
      expect(result.current.copySuccess).toBe(false);
    });

    it('should use custom success duration', async () => {
      const { result } = renderHook(() => useCopyToClipboard(500));

      await act(async () => {
        await result.current.copyToClipboard('Test');
      });

      expect(result.current.copySuccess).toBe(true);

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.copySuccess).toBe(true);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.copySuccess).toBe(false);
    });
  });

  describe('resetCopySuccess', () => {
    it('should reset copySuccess to false', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copyToClipboard('Test');
      });

      expect(result.current.copySuccess).toBe(true);

      act(() => {
        result.current.resetCopySuccess();
      });

      expect(result.current.copySuccess).toBe(false);
    });
  });
});
