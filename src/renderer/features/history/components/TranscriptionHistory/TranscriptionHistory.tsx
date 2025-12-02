import React, { type KeyboardEvent } from 'react';
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

  return (
    <div className="history-container">
      <div className="history-header">
        <h3>📜 Transcription History</h3>
        <div className="history-actions">
          {history.length > 0 && (
            <button className="btn-icon danger" onClick={onClear}>
              🗑️ Clear All
            </button>
          )}
          <button className="btn-icon" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>

      <div className="history-content">
        {history.length === 0 ? (
          <div className="history-empty">
            <span className="empty-icon">📭</span>
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
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(item.id);
                      }}
                      title="Delete transcription"
                      aria-label={`Delete ${item.fileName}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="history-item-meta">
                  <span className="history-tag">{item.model}</span>
                  <span className="history-tag">{getLanguageLabel(item.language)}</span>
                  {item.format && <span className="history-tag">.{item.format}</span>}
                  <span className="history-duration">⏱️ {formatDuration(item.duration)}</span>
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
