import { useState, useEffect } from 'react';
import type { UpdateStatus } from '../../../types';
import {
  checkForUpdates,
  downloadUpdate,
  installUpdate,
  onUpdateStatus,
} from '../../../services/electronAPI';

export interface UseAutoUpdateReturn {
  updateStatus: UpdateStatus | null;
  isChecking: boolean;
  isDownloading: boolean;
  isUpdateAvailable: boolean;
  isUpdateDownloaded: boolean;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => void;
  dismissUpdate: () => void;
}

export function useAutoUpdate(): UseAutoUpdateReturn {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onUpdateStatus((status) => {
      setUpdateStatus(status);
      setIsChecking(false);

      if (status.status === 'error') {
        setError(status.error ?? 'Unknown error');
      } else {
        setError(null);
      }
    });

    return unsubscribe;
  }, []);

  const handleCheckForUpdates = async () => {
    setIsChecking(true);
    setError(null);

    const result = await checkForUpdates();

    if (!result.success) {
      setError(result.error ?? 'Failed to check for updates');
      setIsChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setError(null);

    const result = await downloadUpdate();

    if (!result.success) {
      setError(result.error ?? 'Failed to download update');
    }
  };

  const handleInstallUpdate = () => {
    installUpdate();
  };

  const dismissUpdate = () => {
    setUpdateStatus(null);
    setError(null);
  };

  return {
    updateStatus,
    isChecking,
    isDownloading: updateStatus?.status === 'downloading',
    isUpdateAvailable: updateStatus?.status === 'available',
    isUpdateDownloaded: updateStatus?.status === 'downloaded',
    error,
    checkForUpdates: handleCheckForUpdates,
    downloadUpdate: handleDownloadUpdate,
    installUpdate: handleInstallUpdate,
    dismissUpdate,
  };
}
