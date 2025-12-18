import { useState, useEffect, useCallback } from 'react';
import { checkFFmpeg, logger } from '../services';

export interface UseFFmpegStatusReturn {
  isFFmpegAvailable: boolean | null;
  isChecking: boolean;
  recheckStatus: () => Promise<boolean>;
}

export function useFFmpegStatus(): UseFFmpegStatusReturn {
  const [isFFmpegAvailable, setIsFFmpegAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const recheckStatus = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const available = await checkFFmpeg();
      setIsFFmpegAvailable(available);
      return available;
    } catch (error) {
      logger.error('Failed to check FFmpeg status:', error);
      setIsFFmpegAvailable(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    recheckStatus();
  }, [recheckStatus]);

  return {
    isFFmpegAvailable,
    isChecking,
    recheckStatus,
  };
}
