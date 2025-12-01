import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  transcribe,
  cancel,
  onProgress,
  vttToPlainText,
  vttToSrt,
  convertToFormat,
  saveTranscription,
  initialTranscriptionState,
} from '../services/transcriptionService';
import type { TranscriptionProgress, TranscriptionOptions } from '@/types';
import { overrideElectronAPI } from '@/test/utils';
import { SAMPLE_VTT, createMockFile } from '@/test/fixtures';

describe('transcriptionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes initialTranscriptionState with expected defaults', () => {
    expect(initialTranscriptionState.isTranscribing).toBe(false);
    expect(initialTranscriptionState.progress.percent).toBe(0);
    expect(initialTranscriptionState.transcription).toBe('');
    expect(initialTranscriptionState.error).toBeNull();
  });

  it('transcribe delegates to electronAPI.startTranscription', async () => {
    const startSpy = vi.fn().mockResolvedValue({ success: true, text: 'ok' });
    overrideElectronAPI({ startTranscription: startSpy });

    const options: TranscriptionOptions = {
      filePath: '/path',
      model: 'base',
      language: 'en',
      outputFormat: 'vtt',
    };

    const result = await transcribe(options);

    expect(startSpy).toHaveBeenCalledWith(options);
    expect(result.success).toBe(true);
  });

  it('cancel delegates to electronAPI.cancelTranscription', async () => {
    const cancelSpy = vi.fn().mockResolvedValue({ success: true });
    overrideElectronAPI({ cancelTranscription: cancelSpy });

    await cancel();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('onProgress subscribes via electronAPI and returns unsubscribe', () => {
    const onProgSpy = vi.fn().mockReturnValue(() => {});
    overrideElectronAPI({ onTranscriptionProgress: onProgSpy });

    const cb = vi.fn();
    const unsubscribe = onProgress(cb);
    expect(onProgSpy).toHaveBeenCalledWith(cb);
    expect(typeof unsubscribe).toBe('function');

    const progress: TranscriptionProgress = { percent: 10, status: 'running' };
    cb(progress);
    expect(cb).toHaveBeenCalledWith(progress);
  });

  it('vttToPlainText strips headers and timestamps', () => {
    const txt = vttToPlainText(SAMPLE_VTT);
    expect(txt).toContain('Hello world!');
    expect(txt).toContain('Second line.');
    expect(txt).not.toContain('WEBVTT');
    expect(txt).not.toMatch(/\d{2}:\d{2}/);
  });

  it('vttToSrt converts VTT to SRT format', () => {
    const srt = vttToSrt(SAMPLE_VTT);
    expect(srt).toContain('1');
    expect(srt).toContain('00:00:01,000 --> 00:00:03,000');
    expect(srt).toContain('Hello world!');
  });

  it('convertToFormat routes between txt, srt, and vtt', () => {
    const asTxt = convertToFormat(SAMPLE_VTT, 'txt');
    expect(asTxt).toEqual(vttToPlainText(SAMPLE_VTT));

    const asSrt = convertToFormat(SAMPLE_VTT, 'srt');
    expect(asSrt).toEqual(vttToSrt(SAMPLE_VTT));

    const asVtt = convertToFormat(SAMPLE_VTT, 'vtt');
    expect(asVtt).toBe(SAMPLE_VTT);
  });

  it('saveTranscription returns error when transcription empty', async () => {
    const result = await saveTranscription('', createMockFile(), 'vtt');
    expect(result.success).toBe(false);
    expect(result.error).toBe('No transcription to save');
  });

  it('saveTranscription delegates to electronAPI.saveFile with formatted content', async () => {
    const saveSpy = vi.fn().mockResolvedValue({ success: true, filePath: '/saved.txt' });
    overrideElectronAPI({ saveFile: saveSpy });

    const result = await saveTranscription(SAMPLE_VTT, createMockFile(), 'txt');

    expect(saveSpy).toHaveBeenCalledWith({
      defaultName: 'test.txt',
      content: vttToPlainText(SAMPLE_VTT),
      format: 'txt',
    });
    expect(result.success).toBe(true);
  });

  it('saveTranscription uses default filename when no selectedFile', async () => {
    const saveSpy = vi.fn().mockResolvedValue({ success: true, filePath: '/saved.vtt' });
    overrideElectronAPI({ saveFile: saveSpy });

    await saveTranscription(SAMPLE_VTT, null, 'vtt');

    expect(saveSpy).toHaveBeenCalledWith({
      defaultName: 'transcription.vtt',
      content: SAMPLE_VTT,
      format: 'vtt',
    });
  });
});
