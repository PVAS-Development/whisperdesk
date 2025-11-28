# WhisperDesk - Desktop Transcription App Development Plan

A macOS desktop application for transcribing videos/audio to text using OpenAI's Whisper, Electron, and React.

---

## Overview

**Tech Stack:**
- **Frontend:** Electron + React (with Vite or Create React App)
- **Backend:** Python with OpenAI Whisper
- **IPC:** Electron's inter-process communication to bridge React and Python

**Architecture:**
```
┌─────────────────────────────────────────┐
│           Electron App                   │
│  ┌─────────────────────────────────┐    │
│  │   Renderer Process (React UI)    │    │
│  │   - File picker component        │    │
│  │   - Progress display             │    │
│  │   - Transcription output         │    │
│  │   - Settings panel               │    │
│  └─────────────────────────────────┘    │
│              ↕ IPC                       │
│  ┌─────────────────────────────────┐    │
│  │     Main Process                 │    │
│  │   - File system access           │    │
│  │   - Spawn Python process         │    │
│  │   - Window management            │    │
│  └─────────────────────────────────┘    │
│              ↕ Child Process            │
│  ┌─────────────────────────────────┐    │
│  │     Python + Whisper             │    │
│  │   - Load model                   │    │
│  │   - Transcribe audio/video       │    │
│  │   - Return text                  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## Phase 1: Environment Setup & Prerequisites ✅ COMPLETE
**Estimated Time: 1-2 hours**

### Tasks:
- [x] 1.1 Install Python 3.9+ (if not already installed) → **Python 3.12.4**
- [x] 1.2 Install Node.js 18+ and npm → **Node v22.13.1, npm 10.9.2**
- [x] 1.3 Install FFmpeg (required by Whisper for audio processing) → **FFmpeg 7.1.1**
- [x] 1.4 Create Python virtual environment → **venv created**
- [x] 1.5 Install Whisper and dependencies → **openai-whisper 20250625, PyTorch 2.9.1**
- [x] 1.6 Test Whisper installation → **Working!**
- [x] 1.7 Verify GPU acceleration → **MPS (Metal) available!**

### Deliverables:
- ✅ Working Python environment with Whisper installed
- ✅ FFmpeg available in PATH
- ✅ Node.js ready for Electron development
- ✅ GPU acceleration (Metal/MPS) confirmed

---

## Phase 2: Project Scaffolding with React + Electron ✅ COMPLETE
**Estimated Time: 2-3 hours**

### Tasks:
- [x] 2.1 Initialize project with Vite + React + Electron
- [x] 2.2 Create project structure:
  ```
  whisperdesk/
  ├── package.json
  ├── vite.config.js
  ├── index.html
  ├── electron/
  │   ├── main.js              # Electron main process
  │   └── preload.js           # Preload script for IPC
  ├── src/
  │   ├── App.jsx              # Main React component
  │   ├── App.css
  │   ├── main.jsx             # React entry point
  │   ├── index.css            # Global styles
  │   └── components/
  │       ├── FileDropZone.jsx + .css
  │       ├── SettingsPanel.jsx + .css
  │       ├── ProgressBar.jsx + .css
  │       └── OutputDisplay.jsx + .css
  ├── python/
  │   └── requirements.txt
  └── venv/
  ```
- [x] 2.3 Configure Vite for Electron compatibility
- [x] 2.4 Configure package.json scripts
- [x] 2.5 Create basic Electron window loading React app
- [x] 2.6 Set up hot reload for development

### Commands:
```bash
npm run dev          # Start Vite dev server only
npm run electron:dev # Start Vite + Electron together
npm run build        # Build for production
```

### Deliverables:
- ✅ Electron app that loads React UI
- ✅ Hot reload working for development
- ✅ Organized project structure
- ✅ All UI components created (FileDropZone, SettingsPanel, ProgressBar, OutputDisplay)

---

## Phase 3: Python-Whisper Integration Script ✅ COMPLETE
**Estimated Time: 2-3 hours**

### Tasks:
- [x] 3.1 Create `transcribe.py` with CLI interface
  - Accept input file path as argument
  - Accept model size option (tiny, base, small, medium, large)
  - Output transcription to stdout
  - Progress reporting via stderr (JSON format)
- [x] 3.2 Handle multiple output formats:
  - Plain text (.txt)
  - SRT subtitles (.srt)
  - VTT subtitles (.vtt)
  - JSON with timestamps
- [x] 3.3 Add language detection/selection support
- [x] 3.4 Implement progress callback for real-time updates
- [x] 3.5 Test script independently

### Usage:
```bash
source venv/bin/activate
python python/transcribe.py --input video.mp4 --model base --format txt
python python/transcribe.py -i audio.mp3 -m small -f srt -l en
```

### Deliverables:
- ✅ Standalone Python script that transcribes files
- ✅ Support for multiple models and output formats
- ✅ JSON progress output for IPC

---

## Phase 4: Electron-Python Bridge ✅ COMPLETE
**Estimated Time: 2-3 hours**

### Tasks:
- [x] 4.1 Implement child process spawning in main.js
  - Use `child_process.spawn()` to run Python script
  - Handle stdout for transcription output
  - Handle stderr for progress updates
  - Handle exit codes for success/failure
- [x] 4.2 Set up IPC channels:
  - `transcribe:start` - Start transcription
  - `transcribe:progress` - Progress updates
  - `transcribe:complete` - Transcription finished
  - `transcribe:error` - Error handling
  - `transcribe:cancel` - Cancel ongoing transcription
- [x] 4.3 Create preload.js to expose safe IPC to React
- [x] 4.4 Handle Python path resolution (venv activation)
- [x] 4.5 Create React integration via electronAPI
- [x] 4.6 Test end-to-end communication

### IPC API (exposed via window.electronAPI):
```javascript
electronAPI.openFile()                    // Open file dialog
electronAPI.saveFile(defaultName)         // Save file dialog
electronAPI.startTranscription(options)   // Start transcription
electronAPI.cancelTranscription()         // Cancel in progress
electronAPI.onTranscriptionProgress(cb)   // Listen for progress
electronAPI.getAppInfo()                  // Get app info
```

### Deliverables:
- ✅ Working bridge between Electron and Python
- ✅ React hook for transcription operations
- ✅ Proper IPC setup for all operations

---

## Phase 5: React UI Components ✅ COMPLETE
**Estimated Time: 4-5 hours**

### Tasks:
- [x] 5.1 Create `FileDropZone` component:
  - Drag-and-drop support
  - Click to open file dialog
  - File type validation
  - Display selected file info
- [x] 5.2 Create `SettingsPanel` component:
  - Model selection dropdown
  - Language selection (auto-detect or specific)
  - Output format selection
- [x] 5.3 Create `ProgressBar` component:
  - Visual progress indicator
  - Status messages
- [x] 5.4 Create `OutputDisplay` component:
  - Transcription text display
  - Word/character count
  - Copy to clipboard button (with success feedback)
  - Save to file button
- [x] 5.5 Create `TranscriptionHistory` component:
  - Shows past transcriptions
  - Stored in localStorage
  - Clear history option
- [x] 5.6 Style with CSS (dark mode theme)

### Deliverables:
- ✅ Complete React component library
- ✅ Cohesive dark mode UI design
- ✅ Responsive and functional

---

## Phase 6: Core Functionality Integration ✅ COMPLETE
**Estimated Time: 3-4 hours**

### Tasks:
- [x] 6.1 Wire up transcription workflow to components
- [x] 6.2 Implement complete transcription workflow:
  1. User drops/selects file → FileDropZone
  2. User configures settings → SettingsPanel
  3. User clicks "Transcribe" → Start IPC
  4. Show progress → ProgressBar
  5. Display results → OutputDisplay
- [x] 6.3 Implement file validation in React:
  - Supported formats: mp4, mp3, wav, m4a, webm, mov, avi, flac, ogg, mkv
- [x] 6.4 Implement save functionality:
  - Native save dialog via IPC
  - Writes file to disk
  - Multiple format options (txt, srt, vtt, json)
- [x] 6.5 Add copy to clipboard with visual feedback
- [x] 6.6 Error handling with user-friendly messages
- [x] 6.7 Add transcription history (localStorage)
  - Stores last 20 transcriptions
  - Shows file name, model, duration, preview
  - Clear history option

### Deliverables:
- ✅ Fully functional transcription workflow
- ✅ Robust error handling
- ✅ Persistent history
- ✅ Save to file functionality
- ✅ Copy to clipboard with feedback

---

## Phase 7: Model Management ✅ COMPLETE
**Estimated Time: 2-3 hours**

### Tasks:
- [x] 7.1 Create model info display:
  - Shows size, speed, quality rating for each model
  - Visual quality stars (★★★★★)
- [x] 7.2 Detect which models are already downloaded
  - Python script checks ~/.cache/whisper/
  - Shows ✓ indicator for downloaded models
- [x] 7.3 Show model download progress (first-time use)
  - Download button for undownloaded models
  - Spinner animation during download
- [x] 7.4 Add model pre-download option in settings
  - Can download models before transcription
- [x] 7.5 Display GPU vs CPU inference status
  - Shows "Apple Silicon (Metal)" for MPS
  - Shows CUDA GPU name if available
  - Shows "CPU only" as fallback
- [x] 7.6 Remember last used model preference (localStorage)

### New Files:
- `python/model_manager.py` - Model status and download management

### Deliverables:
- ✅ Clear model selection with tradeoff info
- ✅ Smooth first-run experience
- ✅ Model caching awareness
- ✅ GPU acceleration status display

---

## Phase 8: Testing & Polish
**Estimated Time: 2-3 hours**

### Tasks:
- [ ] 8.1 Test with various file formats
- [ ] 8.2 Test with different file sizes
- [ ] 8.3 Test all Whisper models
- [ ] 8.4 Test error scenarios:
  - Invalid/corrupted file
  - Disk full
  - Process killed
  - Python not found
- [ ] 8.5 Performance optimization:
  - Memory usage monitoring
  - Clean process termination
- [ ] 8.6 Add keyboard shortcuts:
  - `Cmd+O` - Open file
  - `Cmd+S` - Save transcription
  - `Cmd+C` - Copy transcription
  - `Escape` - Cancel transcription
- [ ] 8.7 Add loading states and transitions
- [ ] 8.8 Accessibility review (ARIA labels, focus management)

### Deliverables:
- Robust, well-tested application
- Polished user experience
- Keyboard accessible

---

## Phase 9: Packaging & Distribution
**Estimated Time: 2-3 hours**

### Tasks:
- [ ] 9.1 Configure electron-builder for macOS:
  ```json
  {
    "build": {
      "appId": "com.whisperdesk.app",
      "productName": "WhisperDesk",
      "mac": {
        "category": "public.app-category.productivity",
        "target": ["dmg", "zip"]
      }
    }
  }
  ```
- [ ] 9.2 Bundle Python runtime options:
  - Option A: Require user to have Python installed
  - Option B: Bundle Python with PyInstaller
  - Option C: Use python-shell with embedded Python
- [ ] 9.3 Create app icon (.icns for macOS)
- [ ] 9.4 Set up code signing (optional, for Gatekeeper)
- [ ] 9.5 Create DMG installer with background
- [ ] 9.6 Test packaged app on clean system
- [ ] 9.7 Write installation documentation

### Deliverables:
- Distributable .dmg or .app file
- Installation documentation
- README with setup instructions

---

## Phase 10: Future Enhancements (Optional)
**Post-MVP Features**

- [ ] 10.1 Real-time microphone transcription
- [ ] 10.2 Batch processing multiple files
- [ ] 10.3 Speaker diarization (who said what)
- [ ] 10.4 Translation mode (transcribe + translate)
- [ ] 10.5 Timestamp navigation with audio player
- [ ] 10.6 Integrated video/audio player
- [ ] 10.7 Export to Word, PDF, Markdown
- [ ] 10.8 Keyboard shortcuts customization
- [ ] 10.9 Menu bar quick access mode
- [ ] 10.10 Auto-update functionality
- [ ] 10.11 Multiple language UI
- [ ] 10.12 Whisper.cpp integration (faster, no Python)

---

## Quick Start Commands

```bash
# Navigate to project
cd whisperdesk

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install openai-whisper

# Setup Node/React/Electron
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run build
npm run electron:build
```

---

## Resources

- [Whisper GitHub](https://github.com/openai/whisper)
- [Whisper Model Card](https://github.com/openai/whisper/blob/main/model-card.md)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Electron + Vite Guide](https://electron-vite.org/)
- [Electron Builder](https://www.electron.build/)
- [React Documentation](https://react.dev/)
- [FFmpeg](https://ffmpeg.org/)

---

## Notes

- **Apple Silicon (M1/M2/M3):** Whisper works great on Apple Silicon. PyTorch will use MPS (Metal Performance Shaders) for GPU acceleration automatically.
- **Model Download:** Models are downloaded on first use and cached in `~/.cache/whisper/`
- **Memory Usage:** Larger models require more RAM. The `large` model may need 10GB+ RAM.
- **Transcription Speed:** 
  - `tiny`: ~32x real-time
  - `base`: ~16x real-time  
  - `small`: ~6x real-time
  - `medium`: ~2x real-time
  - `large`: ~1x real-time (on GPU)

---

## Estimated Total Time

| Phase | Description | Time |
|-------|-------------|------|
| 1 | Environment Setup | 1-2 hrs |
| 2 | Project Scaffolding | 2-3 hrs |
| 3 | Python Script | 2-3 hrs |
| 4 | Electron-Python Bridge | 2-3 hrs |
| 5 | React UI Components | 4-5 hrs |
| 6 | Core Integration | 3-4 hrs |
| 7 | Model Management | 2-3 hrs |
| 8 | Testing & Polish | 2-3 hrs |
| 9 | Packaging | 2-3 hrs |
| **Total** | **MVP Complete** | **~20-29 hrs** |

---

**Ready to begin? Let's start with Phase 1!**
