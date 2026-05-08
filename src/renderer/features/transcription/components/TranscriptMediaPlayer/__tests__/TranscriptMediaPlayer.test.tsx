import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranscriptMediaPlayer } from '../TranscriptMediaPlayer';
import { createFullElectronAPIMock } from '@/test/electronAPIMocks';
import type { ElectronAPI } from '@/types/electron';
import type { MediaSourceResult } from '@/types';

function createMediaElementChangeHandler(): {
  mediaElement: { current: HTMLMediaElement | null };
  onMediaElementChange: (element: HTMLMediaElement | null) => void;
} {
  const mediaElement = { current: null as HTMLMediaElement | null };

  return {
    mediaElement,
    onMediaElementChange: (element) => {
      mediaElement.current = element;
    },
  };
}

describe('TranscriptMediaPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as unknown as { electronAPI?: ElectronAPI }).electronAPI = createFullElectronAPIMock();
  });

  it('renders nothing without a selected file', () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
    const onPlaybackTimeChange = vi.fn();

    const { container } = render(
      <TranscriptMediaPlayer
        selectedFile={null}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={onPlaybackTimeChange}
      />
    );

    expect(container).toBeEmptyDOMElement();
    expect(onPlaybackTimeChange).toHaveBeenCalledWith(0);
  });

  it('shows a loading state while resolving the media source', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
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
        onMediaElementChange={onMediaElementChange}
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

  it('does not flash unavailable state before resolving a selected media source', () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn((_filePath: string) => new Promise<MediaSourceResult>(() => {})),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(screen.getByText('Loading media preview...')).toBeInTheDocument();
    expect(screen.queryByText('Media preview unavailable')).not.toBeInTheDocument();
  });

  it('renders unavailable state for missing media sources', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn().mockResolvedValue({ success: false }),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'missing.mp3', path: '/path/missing.mp3' }}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Media preview unavailable')).toBeInTheDocument();
  });

  it('handles files without a usable path', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'missing-path.mp3', path: '' }}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Media preview unavailable')).toBeInTheDocument();
  });

  it('shows media source errors when source resolution rejects', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn().mockRejectedValue(new Error('Preview blocked')),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Preview blocked')).toBeInTheDocument();
  });

  it('stringifies non-error media source rejections', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
    window.electronAPI = {
      ...createFullElectronAPIMock(),
      getMediaSource: vi.fn().mockRejectedValue('Preview unavailable'),
    };

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    expect(await screen.findByText('Preview unavailable')).toBeInTheDocument();
  });

  it('renders video preview and updates duration from metadata', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
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
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    const video = await screen.findByLabelText('Selected video preview');
    Object.defineProperty(video, 'duration', { value: 3661, configurable: true });
    fireEvent.loadedMetadata(video);

    expect(await screen.findByText('01:01:01')).toBeInTheDocument();
  });

  it('supports play, pause, seeking, time updates, and ended state', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
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
        onMediaElementChange={onMediaElementChange}
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
    await waitFor(() => {
      expect(onPlaybackTimeChange).toHaveBeenCalledWith(65);
    });
    expect(screen.getByText('01:05')).toBeInTheDocument();

    Object.defineProperty(audio, 'currentTime', { value: -5, configurable: true });
    fireEvent.timeUpdate(audio);
    expect(screen.getByText('00:00')).toBeInTheDocument();

    fireEvent.ended(audio);
    expect(screen.getByRole('button', { name: 'Play preview' })).toBeInTheDocument();

    playSpy.mockRestore();
    pauseSpy.mockRestore();
  });

  it('supports volume, mute, and playback speed controls', async () => {
    const { mediaElement, onMediaElementChange } = createMediaElementChangeHandler();

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    const audio = await screen.findByLabelText('Selected audio preview');
    expect(mediaElement.current).toBe(audio);

    const volumeSlider = screen.getByLabelText('Volume');
    const speedSelect = screen.getByLabelText('Playback speed');

    fireEvent.change(volumeSlider, { target: { value: '0.35' } });
    expect(audio).toHaveProperty('volume', 0.35);
    expect(audio).toHaveProperty('muted', false);

    fireEvent.click(screen.getByRole('button', { name: 'Mute preview' }));
    expect(audio).toHaveProperty('muted', true);
    expect(screen.getByRole('button', { name: 'Unmute preview' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Unmute preview' }));
    expect(audio).toHaveProperty('muted', false);

    fireEvent.change(volumeSlider, { target: { value: '0' } });
    expect(audio).toHaveProperty('volume', 0);
    expect(audio).toHaveProperty('muted', true);

    fireEvent.click(screen.getByRole('button', { name: 'Unmute preview' }));
    expect(audio).toHaveProperty('volume', 0.8);
    expect(audio).toHaveProperty('muted', false);

    fireEvent.change(speedSelect, { target: { value: '1.5' } });
    expect(audio).toHaveProperty('playbackRate', 1.5);
  });

  it('handles play rejections and invalid metadata values', async () => {
    const { onMediaElementChange } = createMediaElementChangeHandler();
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('blocked'));

    render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onMediaElementChange={onMediaElementChange}
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

  it('clears the external media element when the player unmounts', async () => {
    const { mediaElement, onMediaElementChange } = createMediaElementChangeHandler();

    const { unmount } = render(
      <TranscriptMediaPlayer
        selectedFile={{ name: 'file.mp3', path: '/path/file.mp3' }}
        onMediaElementChange={onMediaElementChange}
        onPlaybackTimeChange={vi.fn()}
      />
    );

    await screen.findByLabelText('Selected audio preview');
    expect(mediaElement.current).toBeInstanceOf(window.HTMLAudioElement);

    unmount();

    expect(mediaElement.current).toBeNull();
  });
});
