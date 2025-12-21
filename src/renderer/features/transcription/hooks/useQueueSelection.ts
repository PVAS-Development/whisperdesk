import { useCallback } from 'react';
import type { QueueItem, SelectedFile } from '../../../types';

export const useQueueSelection = (
  queue: QueueItem[],
  getCompletedTranscription: (id: string) => string | undefined,
  setTranscription: (text: string) => void,
  setSelectedFile: (file: SelectedFile | null) => void,
  setSelectedQueueItemId: (id: string | null) => void
) => {
  const selectQueueItem = useCallback(
    (id: string) => {
      setSelectedQueueItemId(id);
      const transcriptionText = getCompletedTranscription(id);
      if (transcriptionText) {
        setTranscription(transcriptionText);
        const item = queue.find((q) => q.id === id);
        if (item) {
          setSelectedFile(item.file);
        }
      }
    },
    [queue, getCompletedTranscription, setTranscription, setSelectedFile, setSelectedQueueItemId]
  );

  return { selectQueueItem };
};
