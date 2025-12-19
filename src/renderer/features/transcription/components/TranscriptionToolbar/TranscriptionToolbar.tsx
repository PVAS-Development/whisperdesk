import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Copy, Save } from 'lucide-react';
import { Button } from '../../../../components/ui';
import './TranscriptionToolbar.css';
import type { OutputFormat } from '../../../../types';
import { OUTPUT_FORMATS } from '../../../../config';

export interface TranscriptionToolbarProps {
  hasText: boolean;
  onCopy: () => void;
  onSave: (format: OutputFormat) => void;
  copySuccess: boolean;
  wordCount: number;
  charCount: number;
  onToggleSearch: () => void;
  isSearchActive: boolean;
}

function TranscriptionToolbar({
  hasText,
  onCopy,
  onSave,
  copySuccess,
  wordCount,
  charCount,
  onToggleSearch,
  isSearchActive,
}: TranscriptionToolbarProps): React.JSX.Element {
  const [showSaveMenu, setShowSaveMenu] = useState<boolean>(false);
  const saveMenuRef = useRef<HTMLDivElement>(null);

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

  return (
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
          <Button
            variant="icon"
            icon={<Search size={14} />}
            onClick={onToggleSearch}
            title="Search transcript (⌘F)"
            aria-label="Search transcript"
            active={isSearchActive}
          >
            Search
          </Button>
          <Button
            variant="icon"
            icon={copySuccess ? <Check size={14} /> : <Copy size={14} />}
            onClick={onCopy}
            title="Copy to clipboard"
            aria-label="Copy transcription to clipboard"
            className={copySuccess ? 'copied' : ''}
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
          <div className="save-dropdown" ref={saveMenuRef}>
            <Button
              variant="icon"
              icon={<Save size={14} />}
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              title="Save to file"
              aria-label="Save transcription to file"
              aria-expanded={showSaveMenu}
            >
              Save
            </Button>
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
  );
}

export { TranscriptionToolbar };
