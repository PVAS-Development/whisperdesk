import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscription } from '@/features/transcription';
import { overrideElectronAPI } from '@/test/utils';
import { createMockFile } from '@/test/fixtures';

describe('useTranscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFile = createMockFile();

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.transcription).toBe('');
    expect(result.current.error).toBeNull();
    expect(result.current.modelDownloaded).toBe(true);
  });

  it('should initialize with model settings', () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.settings.model).toBe('base');
    expect(result.current.settings.language).toBe('auto');
  });

  it('should set selected file', () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    expect(result.current.selectedFile).toEqual(mockFile);
  });

  it('should update transcription settings', () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSettings({
        model: 'small',
        language: 'pt',
      });
    });

    expect(result.current.settings.model).toBe('small');
    expect(result.current.settings.language).toBe('pt');
  });

  it('should update error state', () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setError('Test error');
    });

    expect(result.current.error).toBe('Test error');

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle save file successfully', async () => {
    const mockSaveFile = vi
      .fn()
      .mockResolvedValue({ success: true, filePath: '/path/to/saved.vtt' });
    overrideElectronAPI({
      saveFile: mockSaveFile,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleSave('vtt');
    });

    expect(mockSaveFile).toHaveBeenCalledWith({
      defaultName: 'test.vtt',
      content: 'Test transcription',
      format: 'vtt',
    });
    expect(result.current.error).toBeNull();
  });

  it('should handle save file error', async () => {
    const mockSaveFile = vi.fn().mockResolvedValue({ success: false, error: 'Save failed' });
    overrideElectronAPI({
      saveFile: mockSaveFile,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleSave('vtt');
    });

    expect(result.current.error).toContain('Failed to save');
  });

  it('should format and save as txt', async () => {
    const mockSaveFile = vi
      .fn()
      .mockResolvedValue({ success: true, filePath: '/path/to/saved.txt' });
    overrideElectronAPI({
      saveFile: mockSaveFile,
    });

    const { result } = renderHook(() => useTranscription());
    const vttContent = 'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world';

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription(vttContent);
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    expect(mockSaveFile).toHaveBeenCalledWith({
      defaultName: 'test.txt',
      content: 'Hello world',
      format: 'txt',
    });
  });

  it('should format and save as srt', async () => {
    const mockSaveFile = vi
      .fn()
      .mockResolvedValue({ success: true, filePath: '/path/to/saved.srt' });
    overrideElectronAPI({
      saveFile: mockSaveFile,
    });

    const { result } = renderHook(() => useTranscription());
    const vttContent = 'WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world';

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription(vttContent);
    });

    await act(async () => {
      await result.current.handleSave('srt');
    });

    const expectedSrtContent = '1\n00:00:01,000 --> 00:00:04,000\nHello world';

    expect(mockSaveFile).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultName: 'test.srt',
        format: 'srt',
      })
    );

    const firstCall = mockSaveFile.mock.calls[0];
    if (!firstCall) {
      throw new Error('mockSaveFile was not called');
    }
    const callArgs = firstCall[0];
    expect(callArgs.content.trim()).toBe(expectedSrtContent);
  });

  it('should handle copy to clipboard', async () => {
    const copyToClipboard = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setTranscription('Text to copy');
    });

    const success = await act(async () => {
      return await result.current.handleCopy(copyToClipboard);
    });

    expect(copyToClipboard).toHaveBeenCalledWith('Text to copy');
    expect(success).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle copy failure', async () => {
    const copyToClipboard = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setTranscription('Text to copy');
    });

    const success = await act(async () => {
      return await result.current.handleCopy(copyToClipboard);
    });

    expect(success).toBe(false);
    expect(result.current.error).toContain('Failed to copy');
  });
});
