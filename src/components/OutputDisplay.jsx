import './OutputDisplay.css'

function OutputDisplay({ text, onSave, onCopy }) {
  const hasText = text && text.length > 0

  return (
    <div className="output-container">
      <div className="output-header">
        <h3>Transcription</h3>
        {hasText && (
          <div className="output-actions">
            <button className="btn-icon" onClick={onCopy} title="Copy to clipboard">
              📋 Copy
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
          </div>
        )}
      </div>
    </div>
  )
}

export default OutputDisplay
