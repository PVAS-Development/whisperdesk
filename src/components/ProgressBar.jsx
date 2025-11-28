import './ProgressBar.css'

function ProgressBar({ percent, status }) {
  return (
    <div 
      className="progress-container"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Transcription progress: ${percent}%`}
    >
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percent}%` }}
        />
        {percent > 5 && (
          <span className="progress-percent">{Math.round(percent)}%</span>
        )}
      </div>
      {status && (
        <div className="progress-status" aria-live="polite">{status}</div>
      )}
    </div>
  )
}

export default ProgressBar