import React, { useRef, useEffect, type ChangeEvent } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '../../../../components/ui';
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
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronUp size={14} />}
          iconOnly
          onClick={onPrevMatch}
          disabled={totalMatches === 0}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<ChevronDown size={14} />}
          iconOnly
          onClick={onNextMatch}
          disabled={totalMatches === 0}
          title="Next match (Enter)"
          aria-label="Next match"
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<X size={14} />}
          iconOnly
          onClick={onClose}
          title="Close search (Esc)"
          aria-label="Close search"
        />
      </div>
    </div>
  );
}

export { TranscriptionSearch };
