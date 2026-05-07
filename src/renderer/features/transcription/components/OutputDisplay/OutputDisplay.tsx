import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './OutputDisplay.css';
import type { OutputFormat, SelectedFile } from '../../../../types';

import { TranscriptionToolbar } from '../TranscriptionToolbar';
import { TranscriptionSearch } from '../TranscriptionSearch';
import { TranscriptionContent } from '../TranscriptionContent';
import { TranscriptMediaPlayer } from '../TranscriptMediaPlayer';
import { parseTranscriptSegments, type TranscriptSegment } from '../../utils/transcriptSegments';

export interface OutputDisplayProps {
  text: string;
  onSave: (format: OutputFormat) => void;
  onCopy: () => void;
  copySuccess: boolean;
  selectedFile?: SelectedFile | null;
}

interface SearchMatch {
  start: number;
  end: number;
}

function OutputDisplay({
  text,
  onSave,
  onCopy,
  copySuccess,
  selectedFile = null,
}: OutputDisplayProps): React.JSX.Element {
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  const hasText = text.length > 0;
  const wordCount = hasText ? text.trim().split(/\s+/).length : 0;
  const charCount = hasText ? text.length : 0;
  const segments = useMemo(() => parseTranscriptSegments(text), [text]);
  const hasSegments = segments.length > 0;
  const searchableText = hasSegments ? segments.map((segment) => segment.text).join('\n') : text;

  const matches = useMemo((): SearchMatch[] => {
    if (!searchQuery || !searchableText) return [];

    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const results: SearchMatch[] = [];

    let match: RegExpExecArray | null;
    while ((match = regex.exec(searchableText)) !== null) {
      results.push({ start: match.index, end: match.index + match[0].length });
    }

    return results;
  }, [searchQuery, searchableText]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (currentMatchIndex >= matches.length) {
      setCurrentMatchIndex(0);
    }
  }, [currentMatchIndex, matches.length]);

  const activeSegmentIndex = useMemo((): number | null => {
    if (!hasSegments) {
      return null;
    }

    const activeSegment = segments.find(
      (segment) => playbackTime >= segment.startSec && playbackTime < segment.endSec
    );
    return activeSegment?.index ?? null;
  }, [hasSegments, playbackTime, segments]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f' && hasText) {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
      if (e.key === 'Enter' && showSearch && matches.length > 0) {
        e.preventDefault();
        if (e.shiftKey) {
          setCurrentMatchIndex((prev) => (prev <= 0 ? matches.length - 1 : prev - 1));
        } else {
          setCurrentMatchIndex((prev) => (prev >= matches.length - 1 ? 0 : prev + 1));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasText, showSearch, matches.length]);

  const handleToggleSearch = (): void => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const handleCloseSearch = (): void => {
    setShowSearch(false);
    setSearchQuery('');
  };

  const handlePrevMatch = (): void => {
    setCurrentMatchIndex((prev) => (prev <= 0 ? matches.length - 1 : prev - 1));
  };

  const handleNextMatch = (): void => {
    setCurrentMatchIndex((prev) => (prev >= matches.length - 1 ? 0 : prev + 1));
  };

  const highlightedText = useMemo((): React.JSX.Element[] | null => {
    if (hasSegments || !searchQuery || !text || matches.length === 0) return null;

    const parts: React.JSX.Element[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      if (match.start > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.start)}</span>);
      }
      parts.push(
        <mark
          key={`match-${index}`}
          className={`search-highlight ${index === currentMatchIndex ? 'current' : ''}`}
          data-match-index={index}
        >
          {text.substring(match.start, match.end)}
        </mark>
      );
      lastIndex = match.end;
    });

    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }

    return parts;
  }, [hasSegments, text, searchQuery, matches, currentMatchIndex]);

  const handleSegmentClick = useCallback((segment: TranscriptSegment): void => {
    const media = mediaRef.current;
    if (!media) {
      return;
    }

    media.currentTime = segment.startSec;
    setPlaybackTime(segment.startSec);
    void media.play().catch(() => {});
  }, []);

  return (
    <div className="output-container">
      <TranscriptionToolbar
        hasText={hasText}
        onCopy={onCopy}
        onSave={onSave}
        copySuccess={copySuccess}
        wordCount={wordCount}
        charCount={charCount}
        onToggleSearch={handleToggleSearch}
        isSearchActive={showSearch}
      />

      {showSearch && hasText && (
        <TranscriptionSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentMatchIndex={currentMatchIndex}
          totalMatches={matches.length}
          onPrevMatch={handlePrevMatch}
          onNextMatch={handleNextMatch}
          onClose={handleCloseSearch}
        />
      )}

      {hasText && hasSegments && selectedFile && (
        <TranscriptMediaPlayer
          selectedFile={selectedFile}
          mediaRef={mediaRef}
          onPlaybackTimeChange={setPlaybackTime}
        />
      )}

      <TranscriptionContent
        hasText={hasText}
        text={text}
        highlightedText={highlightedText}
        currentMatchIndex={currentMatchIndex}
        matchCount={matches.length}
        segments={segments}
        activeSegmentIndex={activeSegmentIndex}
        searchQuery={searchQuery}
        onSegmentClick={handleSegmentClick}
      />
    </div>
  );
}

export { OutputDisplay };
