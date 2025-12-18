type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: Date;
}

const isDev = process.env.NODE_ENV === 'development';
const MAX_LOG_ENTRIES = 500;
const logBuffer: LogEntry[] = [];

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  if (data !== undefined) {
    try {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    } catch {
      return `${prefix} ${message} [Data]`;
    }
  }
  return `${prefix} ${message}`;
}

function storeLogEntry(level: LogLevel, message: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date(),
  };

  logBuffer.push(entry);

  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.shift();
  }
}

function log(level: LogLevel, message: string, data?: unknown): void {
  storeLogEntry(level, message, data);

  if (!isDev && level !== 'error') return;

  const formattedMessage = formatMessage(level, message, data);

  switch (level) {
    case 'debug':
      if (data !== undefined) {
        console.debug(formattedMessage, data);
      } else {
        console.debug(formattedMessage);
      }
      break;
    case 'info':
      if (data !== undefined) {
        console.info(formattedMessage, data);
      } else {
        console.info(formattedMessage);
      }
      break;
    case 'warn':
      if (data !== undefined) {
        console.warn(formattedMessage, data);
      } else {
        console.warn(formattedMessage);
      }
      break;
    case 'error':
      if (data !== undefined) {
        console.error(formattedMessage, data);
      } else {
        console.error(formattedMessage);
      }
      break;
  }
}

function getLogs(): LogEntry[] {
  return [...logBuffer];
}

function clearLogs(): void {
  logBuffer.length = 0;
}

function getLogCount(): number {
  return logBuffer.length;
}

export const logger = {
  debug: (message: string, data?: unknown): void => log('debug', message, data),
  info: (message: string, data?: unknown): void => log('info', message, data),
  warn: (message: string, data?: unknown): void => log('warn', message, data),
  error: (message: string, data?: unknown): void => log('error', message, data),
  isEnabled: (): boolean => isDev,
  getLogs,
  clearLogs,
  getLogCount,
};

export type { LogEntry, LogLevel };
