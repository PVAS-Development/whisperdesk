import { describe, it, expect } from 'vitest';
import {
  createMockHistoryItem,
  createMockFile,
  createMockModels,
  MOCK_SETTINGS,
  MOCK_GPU_INFO,
  MOCK_TRANSCRIPTION_RESULT,
  SAMPLE_VTT,
} from '../fixtures';

describe('fixtures', () => {
  describe('createMockHistoryItem', () => {
    it('creates default history item', () => {
      const item = createMockHistoryItem();
      expect(typeof item.id).toBe('string');
      expect(item.fileName).toBe('test.mp3');
      expect(item.model).toBe('base');
      expect(item.language).toBe('en');
    });

    it('allows overriding properties', () => {
      const item = createMockHistoryItem({ id: 'custom-id-5', fileName: 'custom.mp3' });
      expect(item.id).toBe('custom-id-5');
      expect(item.fileName).toBe('custom.mp3');
      expect(item.model).toBe('base');
    });
  });

  describe('createMockFile', () => {
    it('creates default file', () => {
      const file = createMockFile();
      expect(file.name).toBe('test.mp3');
      expect(file.path).toBe('/path/to/test.mp3');
      expect(file.size).toBe(1024000);
    });

    it('allows overriding properties', () => {
      const file = createMockFile({ name: 'custom.wav', size: 2000000 });
      expect(file.name).toBe('custom.wav');
      expect(file.size).toBe(2000000);
      expect(file.path).toBe('/path/to/test.mp3');
    });
  });

  describe('createMockModels', () => {
    it('creates default 3 models', () => {
      const models = createMockModels();
      expect(models).toHaveLength(3);
      expect(models[0]?.name).toBe('tiny');
      expect(models[1]?.name).toBe('base');
      expect(models[2]?.name).toBe('small');
    });

    it('creates specified count of models', () => {
      const models = createMockModels(2);
      expect(models).toHaveLength(2);
    });

    it('applies downloaded flags correctly', () => {
      const models = createMockModels(3, [true, false, true]);
      expect(models[0]?.downloaded).toBe(true);
      expect(models[1]?.downloaded).toBe(false);
      expect(models[2]?.downloaded).toBe(true);
    });

    it('uses defaults for missing downloaded flags', () => {
      const models = createMockModels(2, [true]);
      expect(models[0]?.downloaded).toBe(true);
      expect(models[1]?.downloaded).toBe(true);
    });
  });

  describe('MOCK_SETTINGS', () => {
    it('contains model and language', () => {
      expect(MOCK_SETTINGS.model).toBe('base');
      expect(MOCK_SETTINGS.language).toBe('en');
    });
  });

  describe('MOCK_GPU_INFO', () => {
    it('contains GPU information', () => {
      expect(MOCK_GPU_INFO.available).toBe(true);
      expect(MOCK_GPU_INFO.type).toBeDefined();
      expect(MOCK_GPU_INFO.name).toBeDefined();
    });
  });

  describe('MOCK_TRANSCRIPTION_RESULT', () => {
    it('contains success and text', () => {
      expect(MOCK_TRANSCRIPTION_RESULT.success).toBe(true);
      expect(MOCK_TRANSCRIPTION_RESULT.text).toBeDefined();
      expect(typeof MOCK_TRANSCRIPTION_RESULT.text).toBe('string');
    });

    it('contains sample transcription text', () => {
      expect(MOCK_TRANSCRIPTION_RESULT.text).toContain('sample');
    });
  });

  describe('SAMPLE_VTT', () => {
    it('is a valid VTT format string', () => {
      expect(SAMPLE_VTT).toContain('WEBVTT');
      expect(SAMPLE_VTT).toContain('-->');
    });

    it('contains timing information', () => {
      expect(SAMPLE_VTT).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
    });
  });
});
