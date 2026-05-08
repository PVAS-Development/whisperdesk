import React, { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import type { TranscriptSegment } from '../../utils/transcriptSegments';
import './TranscriptionContent.css';

export interface TranscriptionContentProps {
  hasText: boolean;
  text: string;
  highlightedText: React.JSX.Element[] | null;
  currentMatchIndex: number;
  matchCount: number;
  segments?: TranscriptSegment[];
  activeSegmentIndex?: number | null;
  searchQuery?: string;
  onSegmentClick?: (segment: TranscriptSegment) => void;
}

function TranscriptionContent({
  hasText,
  text,
  highlightedText,
  currentMatchIndex,
  matchCount,
  segments = [],
  activeSegmentIndex = null,
  searchQuery = '',
  onSegmentClick,
}: TranscriptionContentProps): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchCount > 0 && contentRef.current) {
      const currentMark = contentRef.current.querySelector('.search-highlight.current');
      if (currentMark) {
        currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, matchCount]);

  useEffect(() => {
    if (activeSegmentIndex === null || searchQuery || !contentRef.current) {
      return;
    }

    const activeSegment = contentRef.current.querySelector('.transcript-segment.active');
    if (activeSegment) {
      activeSegment.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSegmentIndex, searchQuery]);

  const renderSegmentText = (
    segmentText: string,
    query: string,
    matchCounter: { value: number }
  ): React.ReactNode => {
    if (!query) {
      return segmentText;
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(segmentText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(segmentText.substring(lastIndex, match.index));
      }

      const globalMatchIndex = matchCounter.value;
      parts.push(
        <mark
          key={`${segmentText}-${globalMatchIndex}`}
          className={`search-highlight ${globalMatchIndex === currentMatchIndex ? 'current' : ''}`}
          data-match-index={globalMatchIndex}
        >
          {segmentText.substring(match.index, match.index + match[0].length)}
        </mark>
      );
      matchCounter.value += 1;
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < segmentText.length) {
      parts.push(segmentText.substring(lastIndex));
    }

    return parts;
  };

  const hasSegments = segments.length > 0;
  const segmentMatchCounter = { value: 0 };

  return (
    <div
      className="output-content"
      ref={contentRef}
      role="region"
      aria-label="Transcription output"
    >
      {hasText && hasSegments ? (
        <div className="transcript-segments" aria-label="Timestamped transcript">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className={`transcript-segment ${
                activeSegmentIndex === segment.index ? 'active' : ''
              }`}
              data-segment-index={segment.index}
            >
              <button
                type="button"
                className="transcript-segment-timestamp"
                onClick={() => onSegmentClick?.(segment)}
                aria-label={`Play from ${segment.timestamp}`}
              >
                {segment.timestamp.split('-->')[0]?.trim() || segment.timestamp}
              </button>
              <p className="transcript-segment-text">
                {renderSegmentText(segment.text, searchQuery, segmentMatchCounter)}
              </p>
            </div>
          ))}
        </div>
      ) : hasText ? (
        <pre className="transcription-text" aria-label="Transcribed text">
          {highlightedText || text}
        </pre>
      ) : (
        <div className="output-placeholder" role="status" aria-live="polite">
          <span className="placeholder-icon">
            <FileText size={48} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <span>Transcription will appear here</span>
          <span className="placeholder-hint">Select a file and click Transcribe to start</span>
        </div>
      )}
    </div>
  );
}

export { TranscriptionContent };
