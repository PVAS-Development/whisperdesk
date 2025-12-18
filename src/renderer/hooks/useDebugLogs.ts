import { useState, useCallback, useEffect } from 'react';
import { logger, type LogEntry } from '../services/logger';
import { useCopyToClipboard } from './useCopyToClipboard';
import { getAppInfo } from '../services/electronAPI';

interface UseDebugLogsReturn {
  logs: LogEntry[];
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  copyLogs: () => Promise<boolean>;
  copyLogsWithSystemInfo: () => Promise<boolean>;
  clearLogs: () => void;
  refreshLogs: () => void;
}

function formatLogEntryForExport(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString();
  const level = entry.level.toUpperCase().padEnd(5);
  const data = entry.data !== undefined ? ` | ${JSON.stringify(entry.data)}` : '';
  return `[${timestamp}] [${level}] ${entry.message}${data}`;
}

function formatLogsForExport(logs: LogEntry[]): string {
  if (logs.length === 0) {
    return 'No logs captured.';
  }
  return logs.map(formatLogEntryForExport).join('\n');
}

function getSystemInfo(osVersion?: string): string {
  const info: string[] = [
    '## System Information',
    '',
    `- **Platform**: ${navigator.platform}`,
    `- **OS Version**: ${osVersion || 'Unknown'}`,
    `- **User Agent**: ${navigator.userAgent}`,
    `- **Language**: ${navigator.language}`,
    `- **Online**: ${navigator.onLine}`,
    `- **Timestamp**: ${new Date().toISOString()}`,
  ];

  if ('memory' in performance) {
    const memory = (
      performance as {
        memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
      }
    ).memory;
    info.push(`- **JS Heap Used**: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB`);
    info.push(`- **JS Heap Total**: ${Math.round(memory.totalJSHeapSize / 1024 / 1024)} MB`);
  }

  return info.join('\n');
}

function useDebugLogs(): UseDebugLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { copyToClipboard } = useCopyToClipboard();

  const refreshLogs = useCallback(() => {
    setLogs(logger.getLogs());
  }, []);

  const openModal = useCallback(() => {
    refreshLogs();
    setIsOpen(true);
  }, [refreshLogs]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearLogs = useCallback(() => {
    logger.clearLogs();
    setLogs([]);
  }, []);

  const copyLogs = useCallback(async (): Promise<boolean> => {
    const formattedLogs = formatLogsForExport(logs);
    const content = ['## Debug Logs', '', '```', formattedLogs, '```'].join('\n');

    return copyToClipboard(content);
  }, [logs, copyToClipboard]);

  const copyLogsWithSystemInfo = useCallback(async (): Promise<boolean> => {
    let osVersion = 'Unknown';
    try {
      const appInfo = await getAppInfo();
      if (appInfo.osVersion) osVersion = appInfo.osVersion;
    } catch (error) {
      console.error('Failed to get app info for system logs:', error);
    }

    const formattedLogs = formatLogsForExport(logs);
    const systemInfo = getSystemInfo(osVersion);
    const content = [systemInfo, '', '## Debug Logs', '', '```', formattedLogs, '```'].join('\n');

    return copyToClipboard(content);
  }, [logs, copyToClipboard]);

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen, refreshLogs]);

  return {
    logs,
    isOpen,
    openModal,
    closeModal,
    copyLogs,
    copyLogsWithSystemInfo,
    clearLogs,
    refreshLogs,
  };
}

export { useDebugLogs };
export type { UseDebugLogsReturn };
