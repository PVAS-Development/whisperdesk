import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useQueueSelection } from '../hooks/useQueueSelection';
import type { QueueItem, SelectedFile } from '../../../types';

describe('useQueueSelection', () => {
  const mockFile: SelectedFile = {
    name: 'test.mp3',
    path: '/path/test.mp3',
  };

  const mockQueue: QueueItem[] = [
    {
      id: '1',
      file: mockFile,
      status: 'completed',
      progress: { percent: 100, status: 'Done' },
    },
  ];

  it('should select queue item and update state when transcription exists', () => {
    const getCompletedTranscription = vi.fn().mockReturnValue('transcription text');
    const setTranscription = vi.fn();
    const setSelectedFile = vi.fn();
    const setSelectedQueueItemId = vi.fn();

    const { result } = renderHook(() =>
      useQueueSelection(
        mockQueue,
        getCompletedTranscription,
        setTranscription,
        setSelectedFile,
        setSelectedQueueItemId
      )
    );

    act(() => {
      result.current.selectQueueItem('1');
    });

    expect(setSelectedQueueItemId).toHaveBeenCalledWith('1');
    expect(getCompletedTranscription).toHaveBeenCalledWith('1');
    expect(setTranscription).toHaveBeenCalledWith('transcription text');
    expect(setSelectedFile).toHaveBeenCalledWith(mockFile);
  });

  it('should not update file or transcription if transcription does not exist', () => {
    const getCompletedTranscription = vi.fn().mockReturnValue(undefined);
    const setTranscription = vi.fn();
    const setSelectedFile = vi.fn();
    const setSelectedQueueItemId = vi.fn();

    const { result } = renderHook(() =>
      useQueueSelection(
        mockQueue,
        getCompletedTranscription,
        setTranscription,
        setSelectedFile,
        setSelectedQueueItemId
      )
    );

    act(() => {
      result.current.selectQueueItem('1');
    });

    expect(setSelectedQueueItemId).toHaveBeenCalledWith('1');
    expect(setTranscription).not.toHaveBeenCalled();
    expect(setSelectedFile).not.toHaveBeenCalled();
  });

  it('should not update file if item not found in queue', () => {
    const getCompletedTranscription = vi.fn().mockReturnValue('text');
    const setTranscription = vi.fn();
    const setSelectedFile = vi.fn();
    const setSelectedQueueItemId = vi.fn();

    const { result } = renderHook(() =>
      useQueueSelection(
        mockQueue,
        getCompletedTranscription,
        setTranscription,
        setSelectedFile,
        setSelectedQueueItemId
      )
    );

    act(() => {
      result.current.selectQueueItem('999');
    });

    expect(setSelectedQueueItemId).toHaveBeenCalledWith('999');
    expect(setTranscription).toHaveBeenCalledWith('text');
    expect(setSelectedFile).not.toHaveBeenCalled();
  });
});
