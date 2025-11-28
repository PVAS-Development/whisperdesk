import './SettingsPanel.css'

const MODELS = [
  { value: 'tiny', label: 'Tiny', size: '39 MB', speed: '~32x', quality: '★★☆☆☆' },
  { value: 'base', label: 'Base', size: '74 MB', speed: '~16x', quality: '★★★☆☆' },
  { value: 'small', label: 'Small', size: '244 MB', speed: '~6x', quality: '★★★★☆' },
  { value: 'medium', label: 'Medium', size: '769 MB', speed: '~2x', quality: '★★★★☆' },
  { value: 'large', label: 'Large', size: '1.5 GB', speed: '~1x', quality: '★★★★★' },
]

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

function SettingsPanel({ settings, onChange, disabled }) {
  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value })
  }

  const selectedModel = MODELS.find(m => m.value === settings.model)

  return (
    <div className={`settings-panel ${disabled ? 'disabled' : ''}`}>
      <h3>Settings</h3>
      
      <div className="setting-group">
        <label>Model</label>
        <select 
          value={settings.model}
          onChange={(e) => handleChange('model', e.target.value)}
          disabled={disabled}
        >
          {MODELS.map(model => (
            <option key={model.value} value={model.value}>
              {model.label} ({model.size})
            </option>
          ))}
        </select>
        {selectedModel && (
          <div className="model-info">
            <span>Speed: {selectedModel.speed}</span>
            <span>Quality: {selectedModel.quality}</span>
          </div>
        )}
      </div>

      <div className="setting-group">
        <label>Language</label>
        <select
          value={settings.language}
          onChange={(e) => handleChange('language', e.target.value)}
          disabled={disabled}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label>Output Format</label>
        <select
          value={settings.outputFormat}
          onChange={(e) => handleChange('outputFormat', e.target.value)}
          disabled={disabled}
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
