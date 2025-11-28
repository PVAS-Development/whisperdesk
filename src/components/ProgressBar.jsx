import './ProgressBar.css'

function ProgressBar({ percent, status }) {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      {status && (
        <div className="progress-status">{status}</div>
      )}
    </div>
  )
}

export default ProgressBar
