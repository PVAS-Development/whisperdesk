import React, { type KeyboardEvent } from 'react';
import { History, Trash2, X, Inbox, Clock } from 'lucide-react';
import { formatDate, formatDuration } from '../../../../utils';
import { getLanguageLabel } from '../../../../config';
import './TranscriptionHistory.css';

import type { HistoryItem } from '../../../../types';

interface TranscriptionHistoryProps {
  history: HistoryItem[];
  onClear: () => void;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
  onDelete: (itemId: number) => void;
}

function TranscriptionHistory({
  history,
  onClear,
  onClose,
  onSelect,
  onDelete,
}: TranscriptionHistoryProps): React.JSX.Element {
  const handleItemKeyDown = (e: KeyboardEvent<HTMLDivElement>, item: HistoryItem): void => {
    if (e.key === 'Enter') {
      onSelect(item);
    }
  };

  const handleDelete = (event: React.MouseEvent, itemId: number, fileName: string): void => {
    event.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the transcription for "${fileName}"?`)) {
      onDelete(itemId);
    }
  };

  const handleClearAll = (): void => {
    if (window.confirm('Are you sure you want to clear all transcription history?')) {
      onClear();
    }
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <h3>
          <History size={20} aria-hidden="true" /> Transcription History
        </h3>
        <div className="history-actions">
          {history.length > 0 && (
            <button className="btn-icon danger" onClick={handleClearAll}>
              <Trash2 size={16} aria-hidden="true" /> Clear All
            </button>
          )}
          <button className="btn-icon" onClick={onClose}>
            <X size={16} aria-hidden="true" /> Close
          </button>
        </div>
      </div>

      <div className="history-content">
        {history.length === 0 ? (
          <div className="history-empty">
            <span className="empty-icon">
              <Inbox size={48} aria-hidden="true" />
            </span>
            <span>No transcriptions yet</span>
            <span className="empty-hint">Your transcription history will appear here</span>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div
                key={item.id}
                className="history-item"
                onClick={() => onSelect(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => handleItemKeyDown(e, item)}
              >
                <div className="history-item-header">
                  <span className="history-filename">{item.fileName}</span>
                  <div className="history-item-header-actions">
                    <span className="history-date">{formatDate(item.date)}</span>
                    <button
                      className="history-item-delete"
                      onClick={(event) => handleDelete(event, item.id, item.fileName)}
                      title="Delete transcription"
                      aria-label={`Delete ${item.fileName}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="history-item-meta">
                  <span className="history-tag">{item.model}</span>
                  <span className="history-tag">{getLanguageLabel(item.language)}</span>
                  {item.format && <span className="history-tag">.{item.format}</span>}
                  <span className="history-duration">
                    <Clock size={12} aria-hidden="true" /> {formatDuration(item.duration)}
                  </span>
                </div>
                <p className="history-preview">{item.preview}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TranscriptionHistory;
