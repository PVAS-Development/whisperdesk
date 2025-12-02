import { describe, it, expect, vi } from 'vitest';
import {
  createDefaultElectronAPIMock,
  createFullElectronAPIMock,
  ElectronAPIMockBuilder,
} from '../electronAPIMocks';

describe('electronAPIMocks', () => {
  describe('createDefaultElectronAPIMock', () => {
    it('creates default mock with all methods', () => {
      const mock = createDefaultElectronAPIMock();
      expect(mock.openFile).toBeDefined();
      expect(mock.saveFile).toBeDefined();
      expect(mock.listModels).toBeDefined();
      expect(mock.startTranscription).toBeDefined();
    });

    it('openFile returns null by default', async () => {
      const mock = createDefaultElectronAPIMock();
      const result = await mock.openFile();
      expect(result).toBeNull();
    });
  });

  describe('createFullElectronAPIMock', () => {
    it('creates full mock with all methods populated', () => {
      const mock = createFullElectronAPIMock();
      expect(mock.openFile).toBeDefined();
      expect(mock.getFileInfo).toBeDefined();
      expect(mock.startTranscription).toBeDefined();
    });

    it('openFile returns valid path', async () => {
      const mock = createFullElectronAPIMock();
      const result = await mock.openFile();
      expect(result).toBe('/path/file.mp3');
    });

    it('startTranscription returns success', async () => {
      const mock = createFullElectronAPIMock();
      const result = await mock.startTranscription({
        filePath: '/path/file.mp3',
        model: 'base',
        language: 'en',
        outputFormat: 'vtt',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('ElectronAPIMockBuilder', () => {
    it('creates builder instance', () => {
      const builder = new ElectronAPIMockBuilder();
      expect(builder).toBeDefined();
    });

    it('withModels sets listModels', async () => {
      const models = [
        {
          name: 'base' as const,
          size: '74 MB',
          speed: '~16x',
          quality: 2 as const,
          downloaded: true,
        },
      ];
      const builder = new ElectronAPIMockBuilder();
      const mock = builder.withModels(models).build();
      const result = await mock.listModels();
      expect(result.models).toEqual(models);
    });

    it('withGpuStatus sets GPU info', async () => {
      const builder = new ElectronAPIMockBuilder();
      const mock = builder.withGpuStatus(true, 'Test GPU').build();
      const result = await mock.getGpuStatus();
      expect(result.available).toBe(true);
      expect(result.name).toBe('Test GPU');
    });

    it('withTranscriptionResult sets transcription', async () => {
      const builder = new ElectronAPIMockBuilder();
      const mock = builder.withTranscriptionResult('Test transcription').build();
      const result = await mock.startTranscription({
        filePath: '/path/file.mp3',
        model: 'base',
        language: 'en',
        outputFormat: 'vtt',
      });
      expect(result.text).toBe('Test transcription');
    });

    it('withDownloadModel sets model download', async () => {
      const builder = new ElectronAPIMockBuilder();
      const mock = builder.withDownloadModel(true).build();
      const result = await mock.downloadModel('base');
      expect(result.success).toBe(true);
    });

    it('withDeleteModel sets model deletion', async () => {
      const builder = new ElectronAPIMockBuilder();
      const mock = builder.withDeleteModel(true).build();
      const result = await mock.deleteModel('base');
      expect(result.success).toBe(true);
    });

    it('withFileOpen sets file open path', async () => {
      const builder = new ElectronAPIMockBuilder();
      const mock = builder.withFileOpen('/custom/path.mp3').build();
      const result = await mock.openFile();
      expect(result).toBe('/custom/path.mp3');
    });

    it('withFileSave sets file save result', async () => {
      const builder = new ElectronAPIMockBuilder();
      const mock = builder.withFileSave(true, '/custom/save.txt').build();
      const result = await mock.saveFile({
        content: 'test',
        format: 'txt',
        defaultName: 'test.txt',
      });
      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/custom/save.txt');
    });

    it('with allows custom overrides', async () => {
      const builder = new ElectronAPIMockBuilder();
      const custom = vi.fn().mockResolvedValue({ success: true });
      const mock = builder.with({ deleteModel: custom }).build();
      await mock.deleteModel('base');
      expect(custom).toHaveBeenCalledWith('base');
    });

    it('chaining works correctly', async () => {
      const builder = new ElectronAPIMockBuilder();
      const mock = builder
        .withGpuStatus(true, 'GPU')
        .withTranscriptionResult('Transcribed')
        .build();

      const gpuResult = await mock.getGpuStatus();
      expect(gpuResult.available).toBe(true);

      const transcResult = await mock.startTranscription({
        filePath: '/path/file.mp3',
        model: 'base',
        language: 'en',
        outputFormat: 'vtt',
      });
      expect(transcResult.text).toBe('Transcribed');
    });
  });
});
