import React, { useRef, useEffect } from 'react';
import { FileText } from 'lucide-react';
import './TranscriptionContent.css';

export interface TranscriptionContentProps {
  hasText: boolean;
  text: string;
  highlightedText: React.JSX.Element[] | null;
  currentMatchIndex: number;
  matchCount: number;
}

function TranscriptionContent({
  hasText,
  text,
  highlightedText,
  currentMatchIndex,
  matchCount,
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

  return (
    <div
      className="output-content"
      ref={contentRef}
      role="region"
      aria-label="Transcription output"
    >
      {hasText ? (
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
