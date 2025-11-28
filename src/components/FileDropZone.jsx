import { useCallback } from 'react'
import './FileDropZone.css'

function FileDropZone({ onFileSelect, selectedFile, disabled }) {
  const handleClick = async () => {
    if (disabled) return
    
    const filePath = await window.electronAPI?.openFile()
    if (filePath) {
      const fileName = filePath.split('/').pop()
      onFileSelect({ path: filePath, name: fileName })
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    if (disabled) return
    
    const file = e.dataTransfer.files[0]
    if (file) {
      onFileSelect({ path: file.path, name: file.name })
    }
  }, [disabled, onFileSelect])

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div 
      className={`dropzone ${disabled ? 'disabled' : ''} ${selectedFile ? 'has-file' : ''}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {selectedFile ? (
        <div className="file-info">
          <span className="file-icon">📁</span>
          <div className="file-details">
            <span className="file-name">{selectedFile.name}</span>
            {selectedFile.size && (
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            )}
          </div>
          <span className="file-change">Click to change</span>
        </div>
      ) : (
        <div className="dropzone-content">
          <span className="dropzone-icon">📂</span>
          <span className="dropzone-text">Drop audio/video file here</span>
          <span className="dropzone-subtext">or click to browse</span>
        </div>
      )}
    </div>
  )
}

export default FileDropZone
