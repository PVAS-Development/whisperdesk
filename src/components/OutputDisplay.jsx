import './OutputDisplay.css'

function OutputDisplay({ text, onSave, onCopy, copySuccess }) {
  const hasText = text && text.length > 0
  const wordCount = hasText ? text.trim().split(/\s+/).length : 0
  const charCount = hasText ? text.length : 0

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
              className={`btn-icon ${copySuccess ? 'success' : ''}`} 
              onClick={onCopy} 
              title="Copy to clipboard"
            >
              {copySuccess ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button className="btn-icon" onClick={onSave} title="Save to file">
              💾 Save
            </button>
          </div>
        )}
      </div>
      
      <div className="output-content">
        {hasText ? (
          <pre className="transcription-text">{text}</pre>
        ) : (
          <div className="output-placeholder">
            <span className="placeholder-icon">📝</span>
            <span>Transcription will appear here</span>
            <span className="placeholder-hint">Select a file and click Transcribe to start</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default OutputDisplay
