import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranscriptMediaPlayer } from '../TranscriptMediaPlayer';
import { createFullElectronAPIMock } from '@/test/electronAPIMocks';
import type { ElectronAPI } from '@/types/electron';

describe('TranscriptMediaPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { electronAPI?: ElectronAPI }).electronAPI = createFullElectronAPIMock();
  });

  it('renders nothing without a selected file', () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    const onPlaybackTimeChange = vi.fn();

    const { container } = render(
      <TranscriptMediaPlayer
        selectedFile={null}
        mediaRef={mediaRef}
        onPlaybackTimeChange={onPlaybackTimeChange}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(onPlaybackTimeChange).toHaveBeenCalledWith(0);
  });

  it('shows a loading state while resolving the media source', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    const onPlaybackTimeChange = vi.fn();
    let resolveSource: (value: { success: boolean; url: string; mediaType: 'audio' }) => void;
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn(
        (_filePath: string) =>
          new Promise<{ success: boolean; url: string; mediaType: 'audio' }>((resolve) => {
            resolveSource = resolve;
          })
      ),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={onPlaybackTimeChange}
      />
    );

    expect(await screen.findByText('Loading media preview...')).toBeInTheDocument();
    resolveSource!({
      success: true,
      url: 'whisperdesk-media://test-audio',
      mediaType: 'audio',
    });
    expect(await screen.findByLabelText('Selected audio preview')).toBeInTheDocument();
  });

  it('renders unavailable state for missing media sources', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn().mockResolvedValue({ success: false }),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'missing.mp3', path: '/path/missing.mp3' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Media preview unavailable')).toBeInTheDocument();
  });

  it('handles files without a usable path', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'missing-path.mp3', path: '' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Media preview unavailable')).toBeInTheDocument();
  });

  it('shows media source errors when source resolution rejects', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn().mockRejectedValue(new Error('Preview blocked')),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Preview blocked')).toBeInTheDocument();
  });

  it('stringifies non-error media source rejections', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn().mockRejectedValue('Preview unavailable'),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Preview unavailable')).toBeInTheDocument();
  });

  it('renders video preview and updates duration from metadata', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn().mockResolvedValue({
        success: true,
        url: 'whisperdesk-media://test-video',
        mediaType: 'video',
      }),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp4', path: '/path/file.mp4' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    const video = await screen.findByLabelText('Selected video preview');
    Object.defineProperty(video, 'duration', { value: 3661, configurable: true });
    fireEvent.loadedMetadata(video);

    expect(await screen.findByText('01:01:01')).toBeInTheDocument();
  });

  it('supports play, pause, seeking, time updates, and ended state', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    const onPlaybackTimeChange = vi.fn();
    const playSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    const pauseSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {});

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={onPlaybackTimeChange}
      />
    );

    const audio = await screen.findByLabelText('Selected audio preview');
    Object.defineProperty(audio, 'duration', { value: 120, configurable: true });
    fireEvent.loadedMetadata(audio);

    const playButton = screen.getByRole('button', { name: 'Play preview' });
    fireEvent.click(playButton);
    expect(playSpy).toHaveBeenCalled();

    fireEvent.play(audio);
    expect(screen.getByRole('button', { name: 'Pause preview' })).toBeInTheDocument();

    Object.defineProperty(audio, 'paused', { value: false, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: 'Pause preview' }));
    expect(pauseSpy).toHaveBeenCalled();

    const seek = screen.getByLabelText('Seek media preview');
    fireEvent.change(seek, { target: { value: '35' } });
    expect(onPlaybackTimeChange).toHaveBeenCalledWith(35);

    Object.defineProperty(audio, 'currentTime', { value: 65, configurable: true });
    fireEvent.timeUpdate(audio);
    expect(onPlaybackTimeChange).toHaveBeenCalledWith(65);
    expect(screen.getByText('01:05')).toBeInTheDocument();

    Object.defineProperty(audio, 'currentTime', { value: -5, configurable: true });
    fireEvent.timeUpdate(audio);
    expect(screen.getByText('00:00')).toBeInTheDocument();

    fireEvent.ended(audio);
    expect(screen.getByRole('button', { name: 'Play preview' })).toBeInTheDocument();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });

  it('handles play rejections and invalid metadata values', async () => {
    const mediaRef = React.createRef<HTMLMediaElement>();
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('blocked'));

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        mediaRef={mediaRef}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    const audio = await screen.findByLabelText('Selected audio preview');
    Object.defineProperty(audio, 'duration', { value: Number.NaN, configurable: true });
    fireEvent.loadedMetadata(audio);
    fireEvent.click(screen.getByRole('button', { name: 'Play preview' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Play preview' })).toBeInTheDocument();
    });
  });
});
