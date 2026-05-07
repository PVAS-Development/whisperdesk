import React, { useEffect, useState, type RefObject } from 'react';
import { AlertCircle, Pause, Play } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { getMediaSource } from '../../../../services/electronAPI';
import type { MediaSourceResult, SelectedFile } from '../../../../types';
import './TranscriptMediaPlayer.css';

export interface TranscriptMediaPlayerProps {
  selectedFile: SelectedFile | null;
  mediaRef: RefObject<HTMLMediaElement | null>;
  onPlaybackTimeChange: (timeSec: number) => void;
}

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
  mediaRef,
  onPlaybackTimeChange,
}: TranscriptMediaPlayerProps): React.JSX.Element | null {
  const [source, setSource] = useState<MediaSourceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let isMounted = true;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    onPlaybackTimeChange(0);

    if (!selectedFile?.path) {
      setSource(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void getMediaSource(selectedFile.path)
      .then((result) => {
        if (isMounted) {
          setSource(result);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setSource({
            success: false,
            error: error instanceof Error ? error.message : String(error),
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

  const handleTimeUpdate = (event: React.SyntheticEvent<HTMLMediaElement>): void => {
    const nextTime = event.currentTarget.currentTime;
    setCurrentTime(nextTime);
    onPlaybackTimeChange(nextTime);
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
  };

  if (isLoading) {
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
      </div>
    </div>
  );
}

export { TranscriptMediaPlayer };
