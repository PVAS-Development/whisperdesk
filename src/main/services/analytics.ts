import { initialize, trackEvent as aptabaseTrack } from '@aptabase/electron/main';
import { app } from 'electron';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const APTABASE_APP_KEY = 'A-US-9040496641';

let initialized = false;

export function initAnalytics() {
  if (initialized || isDev) {
    return;
  }

  if (!APTABASE_APP_KEY) {
    console.warn('Analytics disabled: APTABASE_APP_KEY not configured');
    return;
  }

  try {
    initialize(APTABASE_APP_KEY);
    initialized = true;
    trackEvent('app_launched');
  } catch (error) {
    console.error(
      'Analytics initialization failed - app will continue without usage tracking:',
      error
    );
  }
}

export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
) {
  if (!initialized || isDev) {
    return;
  }

  try {
    aptabaseTrack(eventName, properties);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

export const AnalyticsEvents = {
  // App lifecycle
  APP_LAUNCHED: 'app_launched',
  APP_CLOSED: 'app_closed',

  // Transcription events
  TRANSCRIPTION_STARTED: 'transcription_started',
  TRANSCRIPTION_COMPLETED: 'transcription_completed',
  TRANSCRIPTION_CANCELLED: 'transcription_cancelled',
  TRANSCRIPTION_FAILED: 'transcription_failed',

  // Model events
  MODEL_DOWNLOADED: 'model_downloaded',
  MODEL_DELETED: 'model_deleted',

  // Export events
  EXPORT_SAVED: 'export_saved',

  // Feature usage
  HISTORY_VIEWED: 'history_viewed',
  THEME_CHANGED: 'theme_changed',

  // Auto-update events
  UPDATE_CHECKING: 'update_checking',
  UPDATE_AVAILABLE: 'update_available',
  UPDATE_NOT_AVAILABLE: 'update_not_available',
  UPDATE_DOWNLOADED: 'update_downloaded',
  UPDATE_ERROR: 'update_error',
  UPDATE_INSTALLED: 'update_installed',
} as const;
