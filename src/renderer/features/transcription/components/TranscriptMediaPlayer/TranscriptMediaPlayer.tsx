import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { getMediaSource } from '../../../../services/electronAPI';
import type { MediaSourceResult, SelectedFile } from '../../../../types';
import './TranscriptMediaPlayer.css';

export interface TranscriptMediaPlayerProps {
  selectedFile: SelectedFile | null;
  onMediaElementChange?: (element: HTMLMediaElement | null) => void;
  onPlaybackTimeChange: (timeSec: number) => void;
}

interface MediaSourceState {
  filePath: string;
  result: MediaSourceResult;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const DEFAULT_VOLUME = 1;
const RESTORED_VOLUME = 0.8;

function formatPlaybackTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function TranscriptMediaPlayer({
  selectedFile,
  onMediaElementChange,
  onPlaybackTimeChange,
}: TranscriptMediaPlayerProps): React.JSX.Element | null {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const latestPlaybackTimeRef = useRef(0);
  const playbackFrameRef = useRef<number | null>(null);
  const [sourceState, setSourceState] = useState<MediaSourceState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const emitPlaybackTimeChange = (nextTime: number): void => {
    latestPlaybackTimeRef.current = nextTime;

    if (playbackFrameRef.current !== null) {
      return;
    }

    playbackFrameRef.current = window.requestAnimationFrame(() => {
      playbackFrameRef.current = null;
      onPlaybackTimeChange(latestPlaybackTimeRef.current);
    });
  };

  useEffect(() => {
    return () => {
      if (playbackFrameRef.current !== null) {
        window.cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    onPlaybackTimeChange(0);

    if (!selectedFile?.path) {
      setSourceState(null);
      setIsLoading(false);
      return;
    }

    const filePath = selectedFile.path;
    setIsLoading(true);
    void getMediaSource(filePath)
      .then((result) => {
        if (isMounted) {
          setSourceState({ filePath, result });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSourceState({
            filePath,
            result: {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            },
          });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onPlaybackTimeChange, selectedFile?.path]);

  if (!selectedFile) {
    return null;
  }

  const source = sourceState?.filePath === selectedFile.path ? sourceState.result : null;
  const isResolvingSource = Boolean(selectedFile.path) && (isLoading || source === null);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;

  const handlePlayToggle = (): void => {
    const media = mediaRef.current;
    if (!media) return;

    if (media.paused) {
      void media.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    media.pause();
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const media = mediaRef.current;
    if (!media) return;

    const nextTime = Number(event.target.value);
    media.currentTime = Number.isFinite(nextTime) ? nextTime : 0;
    setCurrentTime(media.currentTime);
    onPlaybackTimeChange(media.currentTime);
  };

  const applyVolume = (media: HTMLMediaElement, nextVolume: number, nextMuted: boolean): void => {
    media.volume = nextVolume;
    media.muted = nextMuted;
  };

  const handleMuteToggle = (): void => {
    const media = mediaRef.current;
    const shouldUnmute = isMuted || volume === 0;
    const nextVolume = shouldUnmute && volume === 0 ? RESTORED_VOLUME : volume;
    const nextMuted = !shouldUnmute;

    setVolume(nextVolume);
    setIsMuted(nextMuted);

    if (media) {
      applyVolume(media, nextVolume, nextMuted);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const media = mediaRef.current;
    const nextVolume = Math.min(1, Math.max(0, Number(event.target.value)));
    const nextMuted = nextVolume === 0;

    setVolume(nextVolume);
    setIsMuted(nextMuted);

    if (media) {
      applyVolume(media, nextVolume, nextMuted);
    }
  };

  const handlePlaybackRateChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const media = mediaRef.current;
    const nextPlaybackRate = Number(event.target.value);

    if (!Number.isFinite(nextPlaybackRate)) {
      return;
    }

    setPlaybackRate(nextPlaybackRate);

    if (media) {
      media.playbackRate = nextPlaybackRate;
    }
  };

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLMediaElement>): void => {
    const nextTime = event.currentTarget.currentTime;
    setCurrentTime(nextTime);
    emitPlaybackTimeChange(nextTime);
  };

  const handleLoadedMetadata = (event: React.SyntheticEvent<HTMLMediaElement>): void => {
    const nextDuration = event.currentTarget.duration;
    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
  };

  const handleEnded = (): void => {
    setIsPlaying(false);
  };

  const setMediaElement = (element: HTMLMediaElement | null): void => {
    mediaRef.current = element;
    onMediaElementChange?.(element);

    if (element) {
      applyVolume(element, volume, isMuted);
      element.playbackRate = playbackRate;
    }
  };

  if (isResolvingSource) {
    return (
      <div className="transcript-media-player" role="status" aria-live="polite">
        <span className="transcript-media-status">Loading media preview...</span>
      </div>
    );
  }

  if (!source?.success || !source.url || !source.mediaType) {
    return (
      <div className="transcript-media-player transcript-media-unavailable" role="status">
        <AlertCircle size={16} aria-hidden="true" />
        <span>{source?.error || 'Media preview unavailable'}</span>
      </div>
    );
  }

  const mediaProps = {
    src: source.url,
    preload: 'metadata',
    onTimeUpdate: handleTimeUpdate,
    onLoadedMetadata: handleLoadedMetadata,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
    onEnded: handleEnded,
  };

  return (
    <div className="transcript-media-player">
      {source.mediaType === 'video' && (
        <video
          ref={setMediaElement}
          className="transcript-video-preview"
          aria-label="Selected video preview"
          {...mediaProps}
        />
      )}

      {source.mediaType === 'audio' && (
        <audio ref={setMediaElement} aria-label="Selected audio preview" {...mediaProps} />
      )}

      <div className="transcript-media-controls">
        <Button
          variant="icon"
          icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
          iconOnly
          onClick={handlePlayToggle}
          title={isPlaying ? 'Pause preview' : 'Play preview'}
          aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
        />
        <span className="transcript-media-time">{formatPlaybackTime(currentTime)}</span>
        <input
          className="transcript-media-seek"
          type="range"
          min="0"
          max={safeDuration}
          step="0.1"
          value={Math.min(currentTime, safeDuration)}
          onChange={handleSeek}
          aria-label="Seek media preview"
          disabled={safeDuration === 0}
        />
        <span className="transcript-media-time">{formatPlaybackTime(safeDuration)}</span>
        <div className="transcript-media-volume">
          <Button
            variant="ghost"
            size="sm"
            icon={isMuted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
            iconOnly
            onClick={handleMuteToggle}
            title={isMuted || volume === 0 ? 'Unmute preview' : 'Mute preview'}
            aria-label={isMuted || volume === 0 ? 'Unmute preview' : 'Mute preview'}
          />
          <input
            className="transcript-media-volume-slider"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
          />
        </div>
        <select
          className="transcript-media-speed"
          value={playbackRate}
          onChange={handlePlaybackRateChange}
          aria-label="Playback speed"
          title="Playback speed"
        >
          {PLAYBACK_SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { TranscriptMediaPlayer };
