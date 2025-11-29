import { useCallback } from 'react'
import './FileDropZone.css'

const SUPPORTED_EXTENSIONS = [
  // Audio
  'mp3', 'wav', 'm4a', 'flac', 'ogg', 'wma', 'aac', 'aiff',
  // Video
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v'
]

function FileDropZone({ onFileSelect, selectedFile, disabled, onClear }) {
  const isValidFile = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return SUPPORTED_EXTENSIONS.includes(ext)
  }

  const handleClick = async () => {
    if (disabled) return
    
    const filePath = await window.electronAPI?.openFile()
    if (filePath) {
      const fileName = filePath.split('/').pop()
      if (isValidFile(fileName)) {
        onFileSelect({ path: filePath, name: fileName })
      }
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    if (disabled) return
    
    const file = e.dataTransfer.files[0]
    if (file && isValidFile(file.name)) {
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
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={selectedFile ? `Selected file: ${selectedFile.name}. Click to change file.` : 'Drop audio or video file here, or click to browse'}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {selectedFile ? (
        <div className="file-info">
          <button
            className="file-remove"
            onClick={(e) => {
              e.stopPropagation()
              onClear?.()
            }}
            title="Remove file"
            aria-label="Remove selected file"
          >
            ✕
          </button>
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
          <span className="dropzone-formats">MP3, WAV, M4A, FLAC, OGG, MP4, MOV, AVI, MKV, WEBM</span>
        </div>
      )}
    </div>
  )
}

export default FileDropZone
