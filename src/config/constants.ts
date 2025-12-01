import type { LanguageCode, OutputFormat, QualityLevel } from '../types';

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
  { value: 'docx', label: 'Word', ext: '.docx' },
  { value: 'pdf', label: 'PDF', ext: '.pdf' },
  { value: 'md', label: 'Markdown', ext: '.md' },
] as const;

export const QUALITY_STARS: readonly string[] = [
  '★☆☆☆☆',
  '★★☆☆☆',
  '★★★☆☆',
  '★★★★☆',
  '★★★★★',
] as const;

export function getQualityStars(quality: QualityLevel): string {
  const index = Math.max(0, Math.min(quality - 1, QUALITY_STARS.length - 1));
  return QUALITY_STARS[index] as string;
}

export const APP_CONFIG = {
  MAX_HISTORY_ITEMS: 20,
  COPY_SUCCESS_DURATION: 2000,
  SAVE_SUCCESS_MESSAGE_DURATION: 3000,
  PROGRESS_INDETERMINATE_MIN: 15,
  PROGRESS_INDETERMINATE_MAX: 85,
} as const;
