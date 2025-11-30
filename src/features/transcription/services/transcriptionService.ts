import type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgress,
  OutputFormat,
  SelectedFile,
} from '../../../types';
import * as electronAPI from '../../../services/electronAPI';

export interface TranscriptionState {
  isTranscribing: boolean;
  progress: TranscriptionProgress;
  transcription: string;
  error: string | null;
  startTime: number | null;
}

export const initialTranscriptionState: TranscriptionState = {
  isTranscribing: false,
  progress: { percent: 0, status: '' },
  transcription: '',
  error: null,
  startTime: null,
};

export async function transcribe(options: TranscriptionOptions): Promise<TranscriptionResult> {
  return electronAPI.startTranscription(options);
}

export async function cancel(): Promise<void> {
  await electronAPI.cancelTranscription();
}

export function onProgress(callback: (progress: TranscriptionProgress) => void): () => void {
  return electronAPI.onTranscriptionProgress(callback);
}

export function vttToPlainText(vttContent: string): string {
  return vttContent
    .split('\n')
    .filter((line) => !line.startsWith('WEBVTT') && !line.match(/^\d{2}:\d{2}/))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function vttToSrt(vttContent: string): string {
  const lines = vttContent.split('\n').filter((l) => l.trim());
  const srtLines: string[] = [];
  let index = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && line.includes('-->')) {
      srtLines.push(String(index++));
      srtLines.push(line.replace(/\./g, ','));
    } else if (line && !line.startsWith('WEBVTT')) {
      srtLines.push(line);
      const nextLine = lines[i + 1];
      if (nextLine?.includes('-->') || i === lines.length - 1) {
        srtLines.push('');
      }
    }
  }

  return srtLines.join('\n');
}

export function convertToFormat(vttContent: string, format: OutputFormat): string {
  switch (format) {
    case 'txt':
      return vttToPlainText(vttContent);
    case 'srt':
      return vttToSrt(vttContent);
    case 'vtt':
    default:
      return vttContent;
  }
}

export async function saveTranscription(
  transcription: string,
  selectedFile: SelectedFile | null,
  format: OutputFormat = 'vtt'
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!transcription) {
    return { success: false, error: 'No transcription to save' };
  }

  const fileName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'transcription';
  const content = convertToFormat(transcription, format);

  const result = await electronAPI.saveFile({
    defaultName: `${fileName}.${format}`,
    content,
    format,
  });

  return result;
}
