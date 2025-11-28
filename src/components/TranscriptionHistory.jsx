import './TranscriptionHistory.css'

function TranscriptionHistory({ history, onClear, onClose }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

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
              <div key={item.id} className="history-item">
                <div className="history-item-header">
                  <span className="history-filename">{item.fileName}</span>
                  <span className="history-date">{formatDate(item.date)}</span>
                </div>
                <div className="history-item-meta">
                  <span className="history-tag">{item.model}</span>
                  <span className="history-tag">{item.language === 'auto' ? 'Auto' : item.language}</span>
                  <span className="history-tag">.{item.format}</span>
                  <span className="history-duration">⏱️ {formatDuration(item.duration)}</span>
                </div>
                <p className="history-preview">{item.preview}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TranscriptionHistory
