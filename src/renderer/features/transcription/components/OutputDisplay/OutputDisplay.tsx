import React, { useState, useEffect, useMemo } from 'react';
import './OutputDisplay.css';
import type { OutputFormat } from '../../../../types';

import { TranscriptionToolbar } from '../TranscriptionToolbar';
import { TranscriptionSearch } from '../TranscriptionSearch';
import { TranscriptionContent } from '../TranscriptionContent';

export interface OutputDisplayProps {
  text: string;
  onSave: (format: OutputFormat) => void;
  onCopy: () => void;
  copySuccess: boolean;
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
}: OutputDisplayProps): React.JSX.Element {
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  const hasText = text.length > 0;
  const wordCount = hasText ? text.trim().split(/\s+/).length : 0;
  const charCount = hasText ? text.length : 0;

  const matches = useMemo((): SearchMatch[] => {
    if (!searchQuery || !text) return [];

    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    const results: SearchMatch[] = [];

    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      results.push({ start: match.index, end: match.index + match[0].length });
    }

    return results;
  }, [searchQuery, text]);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

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
    if (!searchQuery || !text || matches.length === 0) return null;

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
  }, [text, searchQuery, matches, currentMatchIndex]);

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

      <TranscriptionContent
        hasText={hasText}
        text={text}
        highlightedText={highlightedText}
        currentMatchIndex={currentMatchIndex}
        matchCount={matches.length}
      />
    </div>
  );
}

export { OutputDisplay };
