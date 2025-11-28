import { useState, useEffect } from 'react'
import './SettingsPanel.css'

const LANGUAGES = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
]

const OUTPUT_FORMATS = [
  { value: 'txt', label: 'Plain Text (.txt)' },
  { value: 'srt', label: 'SRT Subtitles (.srt)' },
  { value: 'vtt', label: 'VTT Subtitles (.vtt)' },
  { value: 'json', label: 'JSON with Timestamps (.json)' },
]

const QUALITY_STARS = ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★']

function SettingsPanel({ settings, onChange, disabled }) {
  const [models, setModels] = useState([])
  const [gpuInfo, setGpuInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    loadModelInfo()
    
    // Listen for download progress
    const unsubscribe = window.electronAPI?.onModelDownloadProgress?.((data) => {
      if (data.status === 'complete') {
        setDownloading(null)
        loadModelInfo() // Refresh model list
      }
    })
    
    return () => unsubscribe?.()
  }, [])

  const loadModelInfo = async () => {
    try {
      setLoading(true)
      const [modelList, gpu] = await Promise.all([
        window.electronAPI?.listModels(),
        window.electronAPI?.getGpuStatus()
      ])
      
      if (modelList?.models) {
        setModels(modelList.models)
      }
      if (gpu) {
        setGpuInfo(gpu)
      }
    } catch (err) {
      console.error('Failed to load model info:', err)
      // Set default models if API fails
      setModels([
        { name: 'tiny', size: '39 MB', speed: '~32x', quality: 1, downloaded: false },
        { name: 'base', size: '74 MB', speed: '~16x', quality: 2, downloaded: false },
        { name: 'small', size: '244 MB', speed: '~6x', quality: 3, downloaded: false },
        { name: 'medium', size: '769 MB', speed: '~2x', quality: 4, downloaded: false },
        { name: 'large', size: '1.5 GB', speed: '~1x', quality: 5, downloaded: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value })
    // Save last used model to localStorage
    if (key === 'model') {
      localStorage.setItem('whisperdesk_lastModel', value)
    }
  }

  const handleDownloadModel = async (modelName) => {
    try {
      setDownloading(modelName)
      await window.electronAPI?.downloadModel(modelName)
      await loadModelInfo()
    } catch (err) {
      console.error('Failed to download model:', err)
    } finally {
      setDownloading(null)
    }
  }

  // Load last used model on mount
  useEffect(() => {
    const lastModel = localStorage.getItem('whisperdesk_lastModel')
    if (lastModel && lastModel !== settings.model) {
      onChange({ ...settings, model: lastModel })
    }
  }, [])

  const selectedModel = models.find(m => m.name === settings.model)

  return (
    <div className={`settings-panel ${disabled ? 'disabled' : ''}`}>
      <h3>Settings</h3>
      
      {/* GPU Status */}
      {gpuInfo && (
        <div 
          className={`gpu-status ${gpuInfo.available ? 'gpu-available' : 'gpu-unavailable'}`}
          role="status"
          aria-live="polite"
          aria-label={`GPU acceleration: ${gpuInfo.available ? 'enabled' : 'disabled'}. Using ${gpuInfo.name}`}
        >
          <span className="gpu-icon" aria-hidden="true">{gpuInfo.available ? '🚀' : '💻'}</span>
          <span className="gpu-text">{gpuInfo.name}</span>
        </div>
      )}
      
      <div className="setting-group">
        <label htmlFor="model-select">Model</label>
        <select 
          id="model-select"
          value={settings.model}
          onChange={(e) => handleChange('model', e.target.value)}
          disabled={disabled || loading}
          aria-label="Select Whisper model"
          aria-describedby={selectedModel ? 'model-details' : undefined}
        >
          {models.map(model => (
            <option key={model.name} value={model.name}>
              {model.name.charAt(0).toUpperCase() + model.name.slice(1)} ({model.size})
              {model.downloaded ? ' ✓' : ''}
            </option>
          ))}
        </select>
        
        {selectedModel && (
          <div className="model-details" id="model-details" role="status" aria-live="polite">
            <div className="model-info-row">
              <span className="model-stat">
                <span className="stat-label">Speed:</span>
                <span className="stat-value">{selectedModel.speed}</span>
              </span>
              <span className="model-stat">
                <span className="stat-label">Quality:</span>
                <span className="stat-value quality">{QUALITY_STARS[selectedModel.quality - 1]}</span>
              </span>
            </div>
            
            {!selectedModel.downloaded && (
              <div className="model-download">
                {downloading === selectedModel.name ? (
                  <span className="downloading">
                    <span className="spinner"></span> Downloading...
                  </span>
                ) : (
                  <button 
                    className="btn-download"
                    onClick={() => handleDownloadModel(selectedModel.name)}
                    disabled={disabled}
                    aria-label={`Download ${selectedModel.name} model, size ${selectedModel.size}`}
                  >
                    ⬇️ Download {selectedModel.size}
                  </button>
                )}
              </div>
            )}
            
            {selectedModel.downloaded && (
              <span className="model-ready">✓ Ready to use</span>
            )}
          </div>
        )}
      </div>

      <div className="setting-group">
        <label htmlFor="language-select">Language</label>
        <select
          id="language-select"
          value={settings.language}
          onChange={(e) => handleChange('language', e.target.value)}
          disabled={disabled}
          aria-label="Select transcription language"
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label htmlFor="format-select">Output Format</label>
        <select
          id="format-select"
          value={settings.outputFormat}
          onChange={(e) => handleChange('outputFormat', e.target.value)}
          disabled={disabled}
          aria-label="Select output format"
        >
          {OUTPUT_FORMATS.map(format => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default SettingsPanel
