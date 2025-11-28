import { useState, useEffect, useCallback } from 'react'
import FileDropZone from './components/FileDropZone'
import SettingsPanel from './components/SettingsPanel'
import ProgressBar from './components/ProgressBar'
import OutputDisplay from './components/OutputDisplay'
import './App.css'

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

    try {
      const result = await window.electronAPI.startTranscription({
        filePath: selectedFile.path,
        model: settings.model,
        language: settings.language,
        outputFormat: settings.outputFormat
      })
      
      setTranscription(result.text)
      setProgress({ percent: 100, status: 'Complete!' })
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
    const filePath = await window.electronAPI?.saveFile(`${fileName}.${extension}`)
    
    if (filePath) {
      // In a real app, we'd save through IPC. For now, just log.
      console.log('Would save to:', filePath)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎙️ WhisperDesk</h1>
        <p>Transcribe audio & video with OpenAI Whisper</p>
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
          <OutputDisplay
            text={transcription}
            onSave={handleSave}
            onCopy={() => navigator.clipboard.writeText(transcription)}
          />
        </div>
      </main>
    </div>
  )
}

export default App
