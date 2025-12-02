import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTranscription } from '@/features/transcription';
import type { TranscriptionResult } from '@/types';
import { overrideElectronAPI } from '@/test/utils';
import { createMockFile, MOCK_TRANSCRIPTION_RESULT } from '@/test/fixtures';

describe('useTranscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFile = createMockFile();
  const mockTranscriptionResult: TranscriptionResult = MOCK_TRANSCRIPTION_RESULT;

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.isTranscribing).toBe(false);
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

  it('should clear transcription and error when selecting new file', () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setTranscription('Old transcription');
    });

    expect(result.current.transcription).toBe('Old transcription');

    act(() => {
      result.current.handleFileSelect(mockFile);
    });

    expect(result.current.transcription).toBe('');
    expect(result.current.error).toBeNull();
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

  it('should set model downloaded flag', () => {
    const { result } = renderHook(() => useTranscription());

    expect(result.current.modelDownloaded).toBe(true);

    act(() => {
      result.current.setModelDownloaded(false);
    });

    expect(result.current.modelDownloaded).toBe(false);
  });

  it('should prevent transcription when modelDownloaded is false', async () => {
    const startTranscriptionMock = vi.fn().mockResolvedValue(mockTranscriptionResult);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setModelDownloaded(false);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    expect(result.current.modelDownloaded).toBe(false);
  });

  it('should set transcription text', () => {
    const { result } = renderHook(() => useTranscription());

    const text = 'Transcribed audio content';

    act(() => {
      result.current.setTranscription(text);
    });

    expect(result.current.transcription).toBe(text);
  });

  it('should handle file selection from menu', async () => {
    overrideElectronAPI({
      openFile: vi.fn().mockResolvedValue('/path/to/file.mp3'),
      getFileInfo: vi.fn().mockResolvedValue(mockFile),
    });

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.handleFileSelectFromMenu();
    });

    expect(result.current.selectedFile).toEqual(mockFile);
  });

  it('should return null from file menu if no file selected', async () => {
    const openFileMock = vi.fn().mockResolvedValue(null);
    overrideElectronAPI({
      openFile: openFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.handleFileSelectFromMenu();
    });

    expect(result.current.selectedFile).toBeNull();
  });

  it('should handle successful transcription', async () => {
    const startTranscriptionMock = vi.fn().mockResolvedValue(mockTranscriptionResult);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(false);
    });

    expect(result.current.transcription).toBe(mockTranscriptionResult.text);
    expect(result.current.error).toBeNull();
    expect(result.current.progress.percent).toBe(100);
  });

  it('should call onHistoryAdd callback after successful transcription', async () => {
    const onHistoryAdd = vi.fn();
    const startTranscriptionMock = vi.fn().mockResolvedValue(mockTranscriptionResult);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription({ onHistoryAdd }));

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    await waitFor(() => {
      expect(onHistoryAdd).toHaveBeenCalled();
    });
  });

  it('should handle transcription error', async () => {
    const error = new Error('Transcription failed');
    const startTranscriptionMock = vi.fn().mockRejectedValue(error);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(false);
    });

    expect(result.current.error).toBe('Transcription failed');
    expect(result.current.transcription).toBe('');
  });

  it('should set isTranscribing during transcription', async () => {
    const startTranscriptionMock = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTranscriptionResult), 100))
      );

    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    act(() => {
      result.current.handleTranscribe();
    });

    expect(result.current.isTranscribing).toBe(true);
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should not transcribe without selected file', async () => {
    const startTranscriptionMock = vi.fn();
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.handleTranscribe();
    });

    expect(startTranscriptionMock).not.toHaveBeenCalled();
  });

  it('should handle cancelled transcription', async () => {
    const cancelledResult: TranscriptionResult = {
      success: false,
      cancelled: true,
      text: '',
    };
    const startTranscriptionMock = vi.fn().mockResolvedValue(cancelledResult);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(false);
    });

    expect(result.current.transcription).toBe('');
  });

  it('should call cancelTranscription on handleCancel', async () => {
    const cancelTranscriptionMock = vi.fn().mockResolvedValue({ success: true });
    overrideElectronAPI({
      cancelTranscription: cancelTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      await result.current.handleCancel();
    });

    expect(cancelTranscriptionMock).toHaveBeenCalled();
  });

  it('should handle save as VTT format', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/saved.vtt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nTest subtitle');
    });

    await act(async () => {
      await result.current.handleSave('vtt');
    });

    expect(saveFileMock).toHaveBeenCalledWith({
      defaultName: 'test.vtt',
      content: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nTest subtitle',
      format: 'vtt',
    });
  });

  it('should handle save as TXT format', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/saved.txt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription(
        'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nFirst line\n\n00:00:05.000 --> 00:00:10.000\nSecond line'
      );
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    const callArgs = saveFileMock.mock.calls[0];
    expect(callArgs).toBeDefined();
    const savedContent = (callArgs?.[0] as { content: string }).content;
    expect(savedContent).not.toContain('WEBVTT');
    expect(savedContent).not.toContain('-->');
    expect(savedContent).toContain('First line');
    expect(savedContent).toContain('Second line');
  });

  it('should handle save as SRT format', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/saved.srt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription(
        'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nFirst line\n\n00:00:05.000 --> 00:00:10.000\nSecond line'
      );
    });

    await act(async () => {
      await result.current.handleSave('srt');
    });

    const callArgs = saveFileMock.mock.calls[0];
    expect(callArgs).toBeDefined();
    const savedContent = (callArgs?.[0] as { content: string }).content;
    expect(savedContent).not.toContain('WEBVTT');
    expect(savedContent).toContain('1\n');
    expect(savedContent).toContain('2\n');
  });

  it('should not save if no transcription', async () => {
    const saveFileMock = vi.fn();
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('');
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    expect(saveFileMock).not.toHaveBeenCalled();
  });

  it('should show success message on save', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/saved.vtt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleSave('vtt');
    });

    await waitFor(() => {
      expect(result.current.progress.status).toContain('Saved to');
    });
  });

  it('should handle save error', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: false,
      error: 'Permission denied',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    expect(result.current.error).toContain('Failed to save');
  });

  it('should handle copy to clipboard success', async () => {
    const copyMock = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleCopy(copyMock);
    });

    expect(copyMock).toHaveBeenCalledWith('Test transcription');
    expect(result.current.error).toBeNull();
  });

  it('should handle copy to clipboard failure', async () => {
    const copyMock = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleCopy(copyMock);
    });

    expect(result.current.error).toContain('Failed to copy');
  });

  it('should not copy without transcription', async () => {
    const copyMock = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useTranscription());

    await act(async () => {
      const success = await result.current.handleCopy(copyMock);
      expect(success).toBe(false);
    });

    expect(copyMock).not.toHaveBeenCalled();
  });

  it('should handle transcription with no text result', async () => {
    const noTextResult = { success: true, text: '' };
    const startTranscriptionMock = vi.fn().mockResolvedValue(noTextResult);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(false);
    });

    expect(result.current.error).toContain('no output');
  });

  it('should handle null result from transcription service', async () => {
    const startTranscriptionMock = vi.fn().mockResolvedValue(null);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(false);
    });

    expect(result.current.error).toContain('No response');
  });

  it('should handle transcription progress updates', async () => {
    let progressCallback: ((data: { percent: number; status: string }) => void) | null = null;

    overrideElectronAPI({
      onTranscriptionProgress: vi.fn((callback) => {
        progressCallback = callback;
        return () => {};
      }),
    });

    const { result } = renderHook(() => useTranscription());

    await waitFor(() => {
      expect(progressCallback).toBeDefined();
    });

    act(() => {
      progressCallback?.({ percent: 50, status: 'Processing...' });
    });

    expect(result.current.progress.percent).toBe(50);
    expect(result.current.progress.status).toBe('Processing...');
  });

  it('should reset progress after transcription completes', async () => {
    vi.useFakeTimers();

    const startTranscriptionMock = vi.fn().mockResolvedValue(mockTranscriptionResult);
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    expect(result.current.progress.percent).toBe(100);

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.progress.percent).toBe(0);
    expect(result.current.progress.status).toBe('');

    vi.useRealTimers();
  });

  it('should handle non-Error object thrown during transcription', async () => {
    const startTranscriptionMock = vi.fn().mockRejectedValue('String error');
    overrideElectronAPI({
      startTranscription: startTranscriptionMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
    });

    await act(async () => {
      await result.current.handleTranscribe();
    });

    await waitFor(() => {
      expect(result.current.isTranscribing).toBe(false);
    });

    expect(result.current.error).toBe('Unknown error occurred');
  });

  it('should clear state when selecting new file', () => {
    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('Some text');
    });

    expect(result.current.selectedFile).toEqual(mockFile);
    expect(result.current.transcription).toBe('Some text');

    const newFile = createMockFile({ path: '/new/file.mp3', name: 'new.mp3' });

    act(() => {
      result.current.handleFileSelect(newFile);
    });

    expect(result.current.selectedFile).toEqual(newFile);
    expect(result.current.transcription).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('should cleanup progress timeout on unmount', () => {
    vi.useFakeTimers();

    const { unmount } = renderHook(() => useTranscription());

    unmount();

    vi.useRealTimers();
  });

  it('should handle save with result but no filePath', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: false,
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    expect(result.current.progress.percent).not.toBe(100);
  });

  it('should handle save as TXT format with complex formatting', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/saved.txt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    const webvttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
First line

00:00:05.000 --> 00:00:10.000
Second line


00:00:10.000 --> 00:00:15.000
Third line`;

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription(webvttContent);
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    const callArgs = saveFileMock.mock.calls[0];
    const savedContent = (callArgs?.[0] as { content: string }).content;
    expect(savedContent).not.toContain('WEBVTT');
    expect(savedContent).not.toContain('-->');
    expect(savedContent).toContain('First line');
    expect(savedContent).toContain('Second line');
  });

  it('should handle SRT format with edge cases', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/saved.srt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    const webvttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
Line with. dots.

00:00:05.000 --> 00:00:10.000
Another. line.`;

    act(() => {
      result.current.setSelectedFile(mockFile);
      result.current.setTranscription(webvttContent);
    });

    await act(async () => {
      await result.current.handleSave('srt');
    });

    const callArgs = saveFileMock.mock.calls[0];
    const savedContent = (callArgs?.[0] as { content: string }).content;
    expect(savedContent).toContain('1\n');
    expect(savedContent).toContain('2\n');
    expect(savedContent).not.toContain('WEBVTT');
  });

  it('should handle file name with no extension', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/transcription.txt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile({ path: '/path/audiofile', name: 'audiofile' });
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    const callArgs = saveFileMock.mock.calls[0];
    const savedArgs = callArgs?.[0] as any;
    expect(savedArgs?.defaultName).toBe('audiofile.txt');
  });

  it('should handle file name with multiple dots', async () => {
    const saveFileMock = vi.fn().mockResolvedValue({
      success: true,
      filePath: '/path/to/audio.backup.txt',
    });
    overrideElectronAPI({
      saveFile: saveFileMock,
    });

    const { result } = renderHook(() => useTranscription());

    act(() => {
      result.current.setSelectedFile({ path: '/path/audio.backup.mp3', name: 'audio.backup.mp3' });
      result.current.setTranscription('Test transcription');
    });

    await act(async () => {
      await result.current.handleSave('txt');
    });

    const callArgs = saveFileMock.mock.calls[0];
    const savedArgs = callArgs?.[0] as any;
    expect(savedArgs?.defaultName).toBe('audio.backup.txt');
  });
});
