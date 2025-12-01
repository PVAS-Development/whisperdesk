export interface SelectedFile {
  name: string;
  path: string;
  size?: number;
}

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

export type OutputFormat = 'vtt' | 'srt' | 'txt' | 'json' | 'docx' | 'pdf' | 'md';

export interface TranscriptionSettings {
  model: WhisperModelName;
  language: LanguageCode;
}

export type QualityLevel = 1 | 2 | 3 | 4 | 5;

export interface ModelInfo {
  name: string;
  size: string;
  speed: string;
  quality: QualityLevel;
  downloaded: boolean;
  vram?: string;
}

export interface GpuInfo {
  available: boolean;
  type: 'metal' | 'cuda' | 'cpu';
  name: string;
}

export interface ModelDownloadProgress {
  status: 'downloading' | 'complete' | 'error';
  model: string;
  percent?: number;
  downloaded?: string;
  total?: string;
  error?: string;
}

export interface TranscriptionProgress {
  percent: number;
  status: string;
}

export interface TranscriptionOptions {
  filePath: string;
  model: WhisperModelName;
  language: LanguageCode;
  outputFormat: OutputFormat;
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  cancelled?: boolean;
  error?: string;
}

export interface HistoryItem {
  id: number;
  fileName: string;
  filePath: string;
  model: WhisperModelName;
  language: LanguageCode;
  format?: OutputFormat;
  date: string;
  duration: number;
  preview: string;
  fullText: string;
}

export type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

export interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

export interface UpdateDownloadProgress {
  percent: number;
  transferred?: number;
  total?: number;
}

export interface SaveFileOptions {
  defaultName: string;
  content: string;
  format: OutputFormat;
}

export interface SaveFileResult {
  success: boolean;
  filePath?: string;
  canceled?: boolean;
  error?: string;
}

export interface AppInfo {
  isDev: boolean;
  version: string;
  platform: NodeJS.Platform;
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  isTranscribing: boolean;
}

export interface LanguageOption {
  value: LanguageCode;
  label: string;
}

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

export interface OutputFormatOption {
  value: OutputFormat;
  label: string;
  ext: string;
}

export const OUTPUT_FORMATS: readonly OutputFormatOption[] = [
  { value: 'vtt', label: 'VTT Subtitles', ext: '.vtt' },
  { value: 'srt', label: 'SRT Subtitles', ext: '.srt' },
  { value: 'txt', label: 'Plain Text', ext: '.txt' },
] as const;

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

export type Unsubscribe = () => void;

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export const QUALITY_STARS: readonly string[] = [
  '★☆☆☆☆',
  '★★☆☆☆',
  '★★★☆☆',
  '★★★★☆',
  '★★★★★',
] as const;
