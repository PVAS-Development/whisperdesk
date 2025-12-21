import type {
  HistoryItem,
  SelectedFile,
  ModelInfo,
  TranscriptionSettings,
  GpuInfo,
  TranscriptionResult,
} from '@/types';

export const createMockHistoryItem = (overrides?: Partial<HistoryItem>): HistoryItem => ({
  id: crypto.randomUUID(),
  fileName: 'test.mp3',
  filePath: '/path/to/test.mp3',
  model: 'base',
  language: 'en',
  date: new Date().toISOString(),
  duration: 60,
  preview: 'This is a test transcription...',
  fullText: 'This is a test transcription of the audio file',
  ...overrides,
});

export const createMockFile = (overrides?: Partial<SelectedFile>): SelectedFile => ({
  name: 'test.mp3',
  path: '/path/to/test.mp3',
  size: 1024000,
  ...overrides,
});

export const createMockModels = (
  count = 3,
  downloaded: boolean[] = [false, true, false]
): ModelInfo[] =>
  [
    {
      name: 'tiny' as const,
      size: '39 MB',
      speed: '~32x',
      quality: 1 as const,
      downloaded: downloaded[0] ?? false,
    },
    {
      name: 'base' as const,
      size: '74 MB',
      speed: '~16x',
      quality: 2 as const,
      downloaded: downloaded[1] ?? true,
    },
    {
      name: 'small' as const,
      size: '244 MB',
      speed: '~6x',
      quality: 3 as const,
      downloaded: downloaded[2] ?? false,
    },
  ].slice(0, count);

export const MOCK_SETTINGS: TranscriptionSettings = {
  model: 'base',
  language: 'en',
};

export const MOCK_GPU_INFO: GpuInfo = {
  available: true,
  type: 'metal',
  name: 'Apple Silicon (Metal)',
};

export const MOCK_TRANSCRIPTION_RESULT: TranscriptionResult = {
  success: true,
  text: 'This is a sample transcription text for testing purposes. It contains multiple words and sentences.',
};

export const SAMPLE_VTT = `WEBVTT

00:00:01.000 --> 00:00:03.000
Hello world!

00:00:04.000 --> 00:00:06.000
Second line.`;

export const createHistoryItems = (
  count: number,
  baseItem = createMockHistoryItem()
): HistoryItem[] => {
  return Array.from({ length: count }, (_, i) => ({
    ...baseItem,
    id: crypto.randomUUID(),
    fileName: `file${i}.mp3`,
  }));
};
