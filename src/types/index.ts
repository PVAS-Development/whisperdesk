/**
 * WhisperDesk - Shared Type Definitions
 *
 * This file contains all the shared types used throughout the application.
 * These types ensure type safety across components and enforce consistent data structures.
 */

// =============================================================================
// File Types
// =============================================================================

/**
 * Represents a selected file for transcription
 */
export interface SelectedFile {
  /** The file name (basename) */
  name: string;
  /** The full file path */
  path: string;
  /** File size in bytes (optional, may not be available for all files) */
  size?: number;
}

// =============================================================================
// Settings Types
// =============================================================================

/**
 * Available Whisper model names
 */
export type WhisperModelName =
  | 'tiny'
  | 'tiny.en'
  | 'base'
  | 'base.en'
  | 'small'
  | 'small.en'
  | 'medium'
  | 'medium.en'
  | 'large-v3'
  | 'large-v3-turbo';

/**
 * Supported language codes for transcription
 */
export type LanguageCode =
  | 'auto'
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ru'
  | 'ar'
  | 'hi';

/**
 * Output format types for transcription
 */
export type OutputFormat = 'vtt' | 'srt' | 'txt' | 'json';

/**
 * Application settings for transcription
 */
export interface TranscriptionSettings {
  /** The Whisper model to use */
  model: WhisperModelName;
  /** Language for transcription (auto for auto-detect) */
  language: LanguageCode;
}

// =============================================================================
// Model Types
// =============================================================================

/**
 * Quality level rating (1-5 stars)
 */
export type QualityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Information about a Whisper model
 */
export interface ModelInfo {
  /** Model name identifier */
  name: string;
  /** Human-readable size (e.g., "74 MB") */
  size: string;
  /** Speed relative to realtime (e.g., "~16x") */
  speed: string;
  /** Quality rating 1-5 */
  quality: QualityLevel;
  /** Whether the model is downloaded locally */
  downloaded: boolean;
  /** VRAM usage info (may be N/A for CPU/Metal) */
  vram?: string;
}

/**
 * GPU/Acceleration status information
 */
export interface GpuInfo {
  /** Whether GPU acceleration is available */
  available: boolean;
  /** Type of acceleration (metal, cuda, cpu) */
  type: 'metal' | 'cuda' | 'cpu';
  /** Human-readable name/description */
  name: string;
}

/**
 * Model download progress information
 */
export interface ModelDownloadProgress {
  /** Download status */
  status: 'downloading' | 'complete' | 'error';
  /** Model being downloaded */
  model: string;
  /** Progress percentage (0-100) */
  percent?: number;
  /** Downloaded size string */
  downloaded?: string;
  /** Total size string */
  total?: string;
  /** Error message if status is 'error' */
  error?: string;
}

// =============================================================================
// Transcription Types
// =============================================================================

/**
 * Transcription progress information
 */
export interface TranscriptionProgress {
  /** Progress percentage (0-100) */
  percent: number;
  /** Status message to display */
  status: string;
}

/**
 * Options for starting a transcription
 */
export interface TranscriptionOptions {
  /** Path to the audio/video file */
  filePath: string;
  /** Model to use for transcription */
  model: WhisperModelName;
  /** Language code or 'auto' */
  language: LanguageCode;
  /** Desired output format */
  outputFormat: OutputFormat;
}

/**
 * Result of a transcription operation
 */
export interface TranscriptionResult {
  /** Whether transcription was successful */
  success: boolean;
  /** The transcribed text */
  text?: string;
  /** Whether the operation was cancelled */
  cancelled?: boolean;
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// History Types
// =============================================================================

/**
 * A single transcription history entry
 */
export interface HistoryItem {
  /** Unique identifier (typically timestamp) */
  id: number;
  /** Original file name */
  fileName: string;
  /** Full file path */
  filePath: string;
  /** Model used for transcription */
  model: WhisperModelName;
  /** Language used */
  language: LanguageCode;
  /** Output format used */
  format?: OutputFormat;
  /** ISO date string of when transcription was done */
  date: string;
  /** Duration of transcription in seconds */
  duration: number;
  /** Preview of the transcription (first ~100 chars) */
  preview: string;
  /** Full transcription text */
  fullText: string;
}

// =============================================================================
// Update Types
// =============================================================================

/**
 * State of the auto-updater
 */
export type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

/**
 * Information about an available update
 */
export interface UpdateInfo {
  /** New version string */
  version: string;
  /** Release date */
  releaseDate?: string;
  /** Release notes */
  releaseNotes?: string;
}

/**
 * Download progress for updates
 */
export interface UpdateDownloadProgress {
  /** Progress percentage */
  percent: number;
  /** Bytes transferred */
  transferred?: number;
  /** Total bytes */
  total?: number;
}

// =============================================================================
// Dialog Types
// =============================================================================

/**
 * Options for saving a file
 */
export interface SaveFileOptions {
  /** Default file name */
  defaultName: string;
  /** Content to save */
  content: string;
  /** File format */
  format: OutputFormat;
}

/**
 * Result of a save operation
 */
export interface SaveFileResult {
  /** Whether save was successful */
  success: boolean;
  /** Path where file was saved */
  filePath?: string;
  /** Whether user cancelled the dialog */
  canceled?: boolean;
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// App Info Types
// =============================================================================

/**
 * Application information
 */
export interface AppInfo {
  /** Whether running in development mode */
  isDev: boolean;
  /** Application version */
  version: string;
  /** Platform (darwin, win32, linux) */
  platform: NodeJS.Platform;
}

/**
 * Memory usage statistics
 */
export interface MemoryUsage {
  /** Heap memory used in MB */
  heapUsed: number;
  /** Total heap size in MB */
  heapTotal: number;
  /** Resident Set Size in MB */
  rss: number;
  /** External memory in MB */
  external: number;
  /** Whether a transcription is currently running */
  isTranscribing: boolean;
}

// =============================================================================
// Language Configuration
// =============================================================================

/**
 * Language option for the dropdown
 */
export interface LanguageOption {
  /** Language code */
  value: LanguageCode;
  /** Display label */
  label: string;
}

/**
 * Supported languages list
 */
export const LANGUAGES: readonly LanguageOption[] = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
] as const;

// =============================================================================
// Output Format Configuration
// =============================================================================

/**
 * Output format option for the dropdown
 */
export interface OutputFormatOption {
  /** Format value */
  value: OutputFormat;
  /** Display label */
  label: string;
  /** File extension */
  ext: string;
}

/**
 * Available output formats
 */
export const OUTPUT_FORMATS: readonly OutputFormatOption[] = [
  { value: 'vtt', label: 'VTT Subtitles', ext: '.vtt' },
  { value: 'srt', label: 'SRT Subtitles', ext: '.srt' },
  { value: 'txt', label: 'Plain Text', ext: '.txt' },
] as const;

// =============================================================================
// File Support Configuration
// =============================================================================

/**
 * Supported file extensions for transcription
 */
export const SUPPORTED_EXTENSIONS = [
  // Audio
  'mp3',
  'wav',
  'm4a',
  'flac',
  'ogg',
  'wma',
  'aac',
  'aiff',
  // Video
  'mp4',
  'mov',
  'avi',
  'mkv',
  'webm',
  'wmv',
  'flv',
  'm4v',
] as const;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Type for unsubscribe functions returned by event listeners
 */
export type Unsubscribe = () => void;

/**
 * Makes specified properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Quality stars display mapping
 */
export const QUALITY_STARS: readonly string[] = [
  '★☆☆☆☆',
  '★★☆☆☆',
  '★★★☆☆',
  '★★★★☆',
  '★★★★★',
] as const;
