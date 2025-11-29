import { useState, useEffect, useCallback } from 'react'
import FileDropZone from './components/FileDropZone'
import SettingsPanel from './components/SettingsPanel'
import ProgressBar from './components/ProgressBar'
import OutputDisplay from './components/OutputDisplay'
import TranscriptionHistory from './components/TranscriptionHistory'
import UpdateNotification from './components/UpdateNotification'
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

// Load theme from localStorage
const loadTheme = () => {
  try {
    const saved = localStorage.getItem('whisperdesk_theme')
    return saved || 'light'
  } catch {
    return 'light'
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [settings, setSettings] = useState({
    model: 'base',
    language: 'auto'
  })
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [progress, setProgress] = useState({ percent: 0, status: '' })
  const [transcriptionStartTime, setTranscriptionStartTime] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [error, setError] = useState(null)
  const [history, setHistory] = useState(loadHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [theme, setTheme] = useState(loadTheme)
  const [modelDownloaded, setModelDownloaded] = useState(true) // Track if current model is downloaded

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('whisperdesk_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    // Listen for progress updates from main process
    const unsubscribe = window.electronAPI?.onTranscriptionProgress((data) => {
      setProgress(data)
    })
    return () => unsubscribe?.()
  }, [])

  // Listen for menu events
  useEffect(() => {
    const unsubscribers = []
    
    // Cmd+O: Open file
    unsubscribers.push(window.electronAPI?.onMenuOpenFile(() => {
      if (!isTranscribing) {
        handleFileSelectFromMenu()
      }
    }))
    
    // Cmd+S: Save file
    unsubscribers.push(window.electronAPI?.onMenuSaveFile(() => {
      if (transcription && !isTranscribing) {
        handleSave()
      }
    }))
    
    // Cmd+C: Copy transcription (when focus is in the output area)
    unsubscribers.push(window.electronAPI?.onMenuCopyTranscription(() => {
      if (transcription) {
        handleCopy()
      }
    }))
    
    // Cmd+Return: Start transcription
    unsubscribers.push(window.electronAPI?.onMenuStartTranscription(() => {
      if (selectedFile && !isTranscribing) {
        handleTranscribe()
      }
    }))
    
    // Escape: Cancel transcription
    unsubscribers.push(window.electronAPI?.onMenuCancelTranscription(() => {
      if (isTranscribing) {
        handleCancel()
      }
    }))
    
    // Cmd+H: Toggle history
    unsubscribers.push(window.electronAPI?.onMenuToggleHistory(() => {
      setShowHistory(prev => !prev)
    }))
    
    return () => {
      unsubscribers.forEach(unsub => unsub?.())
    }
  }, [isTranscribing, selectedFile, transcription, showHistory])

  const handleFileSelectFromMenu = async () => {
    const filePath = await window.electronAPI?.openFile()
    if (filePath) {
      const fileInfo = await window.electronAPI?.getFileInfo(filePath)
      if (fileInfo) {
        handleFileSelect(fileInfo)
      }
    }
  }

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
    setTranscriptionStartTime(Date.now())

    const startTime = Date.now()

    try {
      const result = await window.electronAPI.startTranscription({
        filePath: selectedFile.path,
        model: settings.model,
        language: settings.language,
        outputFormat: 'vtt'
      })
      
      // Handle cancellation gracefully
      if (result.cancelled) {
        setProgress({ percent: 0, status: 'Cancelled' })
        return
      }
      
      setTranscription(result.text)
      setProgress({ percent: 100, status: 'Complete!' })

      // Add to history
      const historyItem = {
        id: Date.now(),
        fileName: selectedFile.name,
        filePath: selectedFile.path,
        model: settings.model,
        language: settings.language,
        date: new Date().toISOString(),
        duration: Math.round((Date.now() - startTime) / 1000),
        preview: result.text.substring(0, 100) + (result.text.length > 100 ? '...' : ''),
        fullText: result.text
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
    setTranscriptionStartTime(null)
  }

  const handleSave = async (format = 'vtt') => {
    if (!transcription) return
    
    const fileName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'transcription'
    
    // Convert VTT to other formats if needed
    let content = transcription
    if (format === 'txt') {
      // Strip VTT timestamps and convert to plain text
      content = transcription
        .split('\n')
        .filter(line => !line.startsWith('WEBVTT') && !line.match(/^\d{2}:\d{2}/))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    } else if (format === 'srt') {
      // Convert VTT to SRT format
      const lines = transcription.split('\n').filter(l => l.trim())
      const srtLines = []
      let index = 1
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('-->')) {
          srtLines.push(String(index++))
          // Convert VTT timestamp (00:00:00.000) to SRT (00:00:00,000)
          srtLines.push(line.replace(/\./g, ','))
        } else if (!line.startsWith('WEBVTT')) {
          srtLines.push(line)
          if (lines[i + 1]?.includes('-->') || i === lines.length - 1) {
            srtLines.push('')
          }
        }
      }
      content = srtLines.join('\n')
    }
    
    const result = await window.electronAPI?.saveFile({
      defaultName: `${fileName}.${format}`,
      content,
      format
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
          <div className="header-left">
            <div className="app-logo">🎙️</div>
            <div className="header-title">
              <h1>WhisperDesk</h1>
              <p>Transcribe audio & video with AI</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button 
              className="btn-icon history-btn"
              onClick={() => setShowHistory(!showHistory)}
              title="Transcription History"
              aria-label={`${showHistory ? 'Hide' : 'Show'} transcription history. ${history.length} items.`}
            >
              📜 History ({history.length})
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <FileDropZone 
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            disabled={isTranscribing}
            onClear={() => setSelectedFile(null)}
          />
          
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            disabled={isTranscribing}
            onModelStatusChange={setModelDownloaded}
          />

          <div className="actions">
            {!isTranscribing ? (
              <button 
                className="btn-primary"
                onClick={handleTranscribe}
                disabled={!selectedFile || !modelDownloaded}
                aria-label="Start transcription"
                title={!modelDownloaded ? "Please download the selected model first" : ""}
              >
                🚀 Transcribe
              </button>
            ) : (
              <button 
                className="btn-danger"
                onClick={handleCancel}
                aria-label="Cancel ongoing transcription"
              >
                <span className="loading-spinner" aria-hidden="true"></span> Cancel
              </button>
            )}
          </div>

          {(isTranscribing || progress.status) && (
            <ProgressBar 
              percent={progress.percent}
              status={progress.status}
              startTime={transcriptionStartTime}
              isActive={isTranscribing}
            />
          )}

          {error && (
            <div className="error-message" role="alert" aria-live="assertive">
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
              onSelect={(item) => {
                setTranscription(item.fullText)
                setSelectedFile({ name: item.fileName, path: item.filePath })
                setShowHistory(false)
              }}
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
      
      <UpdateNotification />
    </div>
  )
}

export default App
