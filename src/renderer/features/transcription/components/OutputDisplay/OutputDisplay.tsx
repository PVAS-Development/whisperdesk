import React, { useState, useEffect, useRef, useMemo, type ChangeEvent } from 'react';
import { Search, Check, Copy, Save, ChevronUp, ChevronDown, X, FileText } from 'lucide-react';
import type { OutputFormat } from '../../../../types';
import { OUTPUT_FORMATS } from '../../../../config';
import './OutputDisplay.css';

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
  const [showSaveMenu, setShowSaveMenu] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  const saveMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const hasText = text && text.length > 0;
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
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setShowSaveMenu(false);
      }
    };

    if (showSaveMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSaveMenu]);

  const handleSaveFormat = (format: OutputFormat): void => {
    setShowSaveMenu(false);
    onSave(format);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

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

  useEffect(() => {
    if (matches.length > 0 && contentRef.current) {
      const currentMark = contentRef.current.querySelector('.search-highlight.current');
      if (currentMark) {
        currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, matches.length]);

  return (
    <div className="output-container">
      <div className="output-header">
        <h3>Transcription</h3>
        <div className="output-meta">
          {hasText && (
            <span className="word-count">
              {wordCount} words · {charCount} chars
            </span>
          )}
        </div>
        {hasText && (
          <div className="output-actions">
            <button
              className={`btn-icon ${showSearch ? 'active' : ''}`}
              onClick={handleToggleSearch}
              title="Search transcript (⌘F)"
              aria-label="Search transcript"
            >
              <Search size={14} /> Search
            </button>
            <button
              className={`btn-icon ${copySuccess ? 'success' : ''}`}
              onClick={onCopy}
              title="Copy to clipboard"
              aria-label="Copy transcription to clipboard"
            >
              {copySuccess ? (
                <>
                  <Check size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy
                </>
              )}
            </button>
            <div className="save-dropdown" ref={saveMenuRef}>
              <button
                className="btn-icon"
                onClick={() => setShowSaveMenu(!showSaveMenu)}
                title="Save to file"
                aria-label="Save transcription to file"
                aria-expanded={showSaveMenu}
              >
                <Save size={14} /> Save
              </button>
              {showSaveMenu && (
                <div className="save-menu">
                  {OUTPUT_FORMATS.map((format) => (
                    <button
                      key={format.value}
                      className="save-menu-item"
                      onClick={() => handleSaveFormat(format.value)}
                    >
                      {format.label} <span className="format-ext">{format.ext}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSearch && hasText && (
        <div className="search-bar">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search transcript"
          />
          <div className="search-nav">
            {searchQuery && (
              <span className="search-count">
                {matches.length > 0
                  ? `${currentMatchIndex + 1} of ${matches.length}`
                  : 'No matches'}
              </span>
            )}
            <button
              className="search-nav-btn"
              onClick={handlePrevMatch}
              disabled={matches.length === 0}
              title="Previous match (Shift+Enter)"
              aria-label="Previous match"
            >
              <ChevronUp size={14} />
            </button>
            <button
              className="search-nav-btn"
              onClick={handleNextMatch}
              disabled={matches.length === 0}
              title="Next match (Enter)"
              aria-label="Next match"
            >
              <ChevronDown size={14} />
            </button>
            <button
              className="search-nav-btn close"
              onClick={handleCloseSearch}
              title="Close search (Esc)"
              aria-label="Close search"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}

export default OutputDisplay;
