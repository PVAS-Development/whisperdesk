import { useState, useCallback } from 'react';
import { APP_CONFIG } from '../config/constants';

export interface UseCopyToClipboardReturn {
  copySuccess: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  resetCopySuccess: () => void;
}

export function useCopyToClipboard(
  successDuration: number = APP_CONFIG.COPY_SUCCESS_DURATION
): UseCopyToClipboardReturn {
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), successDuration);
        return true;
      } catch {
        return false;
      }
    },
    [successDuration]
  );

  const resetCopySuccess = useCallback(() => {
    setCopySuccess(false);
  }, []);

  return {
    copySuccess,
    copyToClipboard,
    resetCopySuccess,
  };
}
