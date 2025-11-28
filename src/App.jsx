import { useState, useEffect, useCallback } from 'react'
import FileDropZone from './components/FileDropZone'
import SettingsPanel from './components/SettingsPanel'
import ProgressBar from './components/ProgressBar'
import OutputDisplay from './components/OutputDisplay'
import TranscriptionHistory from './components/TranscriptionHistory'
import './App.css'

// Load history from localStorage
const loadHistory = () => {
  try {
    const saved = localStorage.getItem('whisperdesk_history')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Save history to localStorage
const saveHistory = (history) => {
  try {
    // Keep only last 20 items
    const trimmed = history.slice(0, 20)
    localStorage.setItem('whisperdesk_history', JSON.stringify(trimmed))
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [settings, setSettings] = useState({
    model: 'base',
    language: 'auto',
    outputFormat: 'txt'
  })
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, status: '' })
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState(null)
  const [history, setHistory] = useState(loadHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    // Listen for progress updates from main process
    const unsubscribe = window.electronAPI?.onTranscriptionProgress((data) => {
      setProgress(data)
    })
    return () => unsubscribe?.()
  }, [])

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file)
    setTranscription('')
    setError(null)
    setProgress({ percent: 0, status: '' })
  }, [])

  const handleTranscribe = async () => {
    if (!selectedFile) return

    setIsTranscribing(true)
    setError(null)
    setProgress({ percent: 0, status: 'Starting transcription...' })

    const startTime = Date.now()

    try {
      const result = await window.electronAPI.startTranscription({
        filePath: selectedFile.path,
        model: settings.model,
        language: settings.language,
        outputFormat: settings.outputFormat
      })
      
      setTranscription(result.text)
      setProgress({ percent: 100, status: 'Complete!' })

      // Add to history
      const historyItem = {
        id: Date.now(),
        fileName: selectedFile.name,
        model: settings.model,
        language: settings.language,
        format: settings.outputFormat,
        date: new Date().toISOString(),
        duration: Math.round((Date.now() - startTime) / 1000),
        preview: result.text.substring(0, 100) + (result.text.length > 100 ? '...' : '')
      }
      const newHistory = [historyItem, ...history]
      setHistory(newHistory)
      saveHistory(newHistory)

    } catch (err) {
      setError(err.message)
      setProgress({ percent: 0, status: '' })
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleCancel = async () => {
    await window.electronAPI?.cancelTranscription()
    setIsTranscribing(false)
    setProgress({ percent: 0, status: 'Cancelled' })
  }

  const handleSave = async () => {
    if (!transcription) return
    
    const fileName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'transcription'
    const extension = settings.outputFormat
    
    const result = await window.electronAPI?.saveFile({
      defaultName: `${fileName}.${extension}`,
      content: transcription,
      format: extension
    })
    
    if (result?.success) {
      setProgress({ percent: 100, status: `Saved to ${result.filePath}` })
    } else if (result?.error) {
      setError(`Failed to save: ${result.error}`)
    }
  }

  const handleCopy = async () => {
    if (!transcription) return
    
    try {
      await navigator.clipboard.writeText(transcription)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('whisperdesk_history')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>🎙️ WhisperDesk</h1>
            <p>Transcribe audio & video with OpenAI Whisper</p>
          </div>
          <button 
            className="btn-icon history-btn"
            onClick={() => setShowHistory(!showHistory)}
            title="Transcription History"
          >
            📜 History ({history.length})
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <FileDropZone 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            disabled={isTranscribing}
          />
          
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            disabled={isTranscribing}
          />

          <div className="actions">
            {!isTranscribing ? (
              <button 
                className="btn-primary"
                onClick={handleTranscribe}
                disabled={!selectedFile}
              >
                🚀 Transcribe
              </button>
            ) : (
              <button 
                className="btn-danger"
                onClick={handleCancel}
              >
                ✕ Cancel
              </button>
            )}
          </div>

          {(isTranscribing || progress.status) && (
            <ProgressBar 
              percent={progress.percent}
              status={progress.status}
            />
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
        </div>

        <div className="right-panel">
          {showHistory ? (
            <TranscriptionHistory 
              history={history}
              onClear={clearHistory}
              onClose={() => setShowHistory(false)}
            />
          ) : (
            <OutputDisplay
              text={transcription}
              onSave={handleSave}
              onCopy={handleCopy}
              copySuccess={copySuccess}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
