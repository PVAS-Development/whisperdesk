import { useState, useEffect } from 'react';
import { startRecording, stopRecording } from '../services/audioRecorderService';
import type { HttStatus } from '../../../types';

export interface UseHoldToTranscribeReturn {
  status: HttStatus;
  lastResult: string | null;
  lastError: string | null;
}

export function useHoldToTranscribe(): UseHoldToTranscribeReturn {
  const [status, setStatus] = useState<HttStatus>('idle');
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const unsubStart = window.electronAPI?.onHttStartRecording(async () => {
      try {
        setStatus('recording');
        setLastError(null);
        await startRecording();
      } catch (err) {
        console.error('Failed to start recording:', err);
        setStatus('error');
        setLastError('Failed to start recording');
      }
    });

    const unsubStop = window.electronAPI?.onHttStopRecording(async () => {
      try {
        setStatus('processing');
        const buffer = await stopRecording();
        await window.electronAPI?.httSaveAudio(buffer);
      } catch (err) {
        console.error('Failed to stop recording:', err);
        setStatus('error');
        setLastError('Failed to process recording');
      }
    });

    const unsubResult = window.electronAPI?.onHttTranscriptionResult((data) => {
      if (data.error) {
        setStatus('error');
        setLastError(data.error);
      } else {
        setStatus('idle');
        setLastResult(data.text);
      }
    });

    const unsubAccessibility = window.electronAPI?.onHttAccessibilityRequired(() => {
      // Auto-request accessibility when prompted
      window.electronAPI?.httRequestAccessibility();
    });

    return () => {
      unsubStart?.();
      unsubStop?.();
      unsubResult?.();
      unsubAccessibility?.();
    };
  }, []);

  return { status, lastResult, lastError };
}
