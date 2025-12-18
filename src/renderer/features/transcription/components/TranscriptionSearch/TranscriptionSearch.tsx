import React, { useRef, useEffect, type ChangeEvent } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import './TranscriptionSearch.css';

export interface TranscriptionSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentMatchIndex: number;
  totalMatches: number;
  onPrevMatch: () => void;
  onNextMatch: () => void;
  onClose: () => void;
}

function TranscriptionSearch({
  searchQuery,
  onSearchChange,
  currentMatchIndex,
  totalMatches,
  onPrevMatch,
  onNextMatch,
  onClose,
}: TranscriptionSearchProps): React.JSX.Element {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onSearchChange(e.target.value);
  };

  return (
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
            {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : 'No matches'}
          </span>
        )}
        <button
          className="search-nav-btn"
          onClick={onPrevMatch}
          disabled={totalMatches === 0}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="search-nav-btn"
          onClick={onNextMatch}
          disabled={totalMatches === 0}
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <ChevronDown size={14} />
        </button>
        <button
          className="search-nav-btn close"
          onClick={onClose}
          title="Close search (Esc)"
          aria-label="Close search"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export { TranscriptionSearch };
