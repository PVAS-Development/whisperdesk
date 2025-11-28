# 🎙️ WhisperDesk

A beautiful, native macOS desktop application for transcribing audio and video files using OpenAI's Whisper AI model.

![WhisperDesk Screenshot](docs/screenshot.png)

## ✨ Features

- **Drag & Drop** - Simply drag audio/video files into the app
- **Multiple Formats** - Supports MP4, MP3, WAV, M4A, WebM, MOV, AVI, FLAC, OGG, MKV
- **Multiple Models** - Choose from tiny, base, small, medium, or large Whisper models
- **Output Formats** - Export as plain text, SRT subtitles, VTT subtitles, or JSON with timestamps
- **Language Support** - Auto-detect or select from 90+ languages
- **Apple Silicon Optimized** - GPU acceleration with Metal/MPS on M1/M2/M3 Macs
- **Dark Mode** - Beautiful dark theme that respects your system preference
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Transcription History** - Keep track of your recent transcriptions

## 📋 Requirements

- **macOS** 10.15 (Catalina) or later
- **Python** 3.9 or later
- **FFmpeg** (for audio processing)
- ~2GB disk space (for Whisper models)

## 🚀 Installation

### 1. Install Prerequisites

#### Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install Python 3
```bash
brew install python@3.11
```

#### Install FFmpeg
```bash
brew install ffmpeg
```

#### Install Whisper
```bash
pip3 install openai-whisper
```

### 2. Install WhisperDesk

#### Option A: Download DMG (Recommended)
1. Download the latest `WhisperDesk-x.x.x.dmg` from [Releases](https://github.com/whisperdesk/whisperdesk/releases)
2. Open the DMG file
3. Drag WhisperDesk to your Applications folder
4. Launch WhisperDesk from Applications

#### Option B: Build from Source
```bash
# Clone the repository
git clone https://github.com/whisperdesk/whisperdesk.git
cd whisperdesk

# Install dependencies
npm install

# Create Python virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install openai-whisper

# Run in development mode
npm run electron:dev

# Or build for production
npm run electron:build
```

## 🎮 Usage

1. **Open a File** - Drag and drop an audio/video file into the app, or click to browse
2. **Configure Settings** - Choose your preferred model, language, and output format
3. **Transcribe** - Click "Transcribe" and wait for the magic to happen
4. **Save/Copy** - Save the transcription to a file or copy to clipboard

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+O` | Open file |
| `Cmd+S` | Save transcription |
| `Cmd+C` | Copy transcription |
| `Cmd+Return` | Start transcription |
| `Cmd+H` | Toggle history |
| `Escape` | Cancel transcription |

## 🧠 Whisper Models

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `tiny` | 39 MB | ~32x | ★☆☆☆☆ | Quick drafts, testing |
| `base` | 74 MB | ~16x | ★★☆☆☆ | Fast transcription |
| `small` | 244 MB | ~6x | ★★★☆☆ | Balanced speed/quality |
| `medium` | 769 MB | ~2x | ★★★★☆ | High quality |
| `large` | 1.5 GB | ~1x | ★★★★★ | Best quality |

Models are downloaded automatically on first use and cached in `~/.cache/whisper/`.

## 🔧 Development

### Prerequisites
- Node.js 18+
- Python 3.9+
- npm or yarn

### Setup
```bash
# Clone and install
git clone https://github.com/whisperdesk/whisperdesk.git
cd whisperdesk
npm install

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r python/requirements.txt

# Run development server
npm run electron:dev
```

### Building
```bash
# Build for macOS
npm run electron:build:mac

# Build directory only (faster, for testing)
npm run electron:build:dir
```

### Releasing a New Version

The release process is automated. Just run:

```bash
# Release with patch version bump (1.0.0 -> 1.0.1)
./scripts/release.sh

# Release with minor version bump (1.0.0 -> 1.1.0)
./scripts/release.sh minor

# Release with major version bump (1.0.0 -> 2.0.0)
./scripts/release.sh major

# Re-release current version (e.g., to fix a failed build)
./scripts/release.sh --force
```

This will:
1. Bump the version in `package.json`
2. Generate/update `CHANGELOG.md` from git commits
3. Commit the changes
4. Create and push a git tag
5. Trigger GitHub Actions to build and publish the release

**Commit Message Convention** (for better changelogs):
```
feat: add new feature        # ✨ Features
fix: fix a bug               # 🐛 Bug Fixes  
docs: update documentation   # 📚 Documentation
style: styling changes       # 💄 Styling
refactor: code refactoring   # ♻️ Refactoring
perf: performance improvement # ⚡ Performance
chore: maintenance tasks     # 🔨 Chores
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run electron:dev` | Start app in development mode |
| `npm run electron:build:mac` | Build macOS DMG (bumps version) |
| `npm run icons` | Generate app icons from SVG |
| `npm run changelog` | Generate CHANGELOG.md |
| `npm run bump:patch` | Bump patch version |
| `npm run bump:minor` | Bump minor version |
| `npm run bump:major` | Bump major version |

### Project Structure
```
whisperdesk/
├── electron/           # Electron main process
│   ├── main.js         # Main process entry
│   └── preload.js      # Preload scripts for IPC
├── src/                # React frontend
│   ├── App.jsx         # Main app component
│   └── components/     # React components
├── python/             # Python transcription scripts
│   ├── transcribe.py   # Main transcription logic
│   └── model_manager.py # Model management
├── build/              # Build resources (icons, etc.)
└── scripts/            # Build scripts
```

## 🐛 Troubleshooting

### "Python not found" error
Make sure Python 3.9+ is installed and Whisper is installed:
```bash
python3 --version
pip3 install openai-whisper
```

### "FFmpeg not found" error
Install FFmpeg via Homebrew:
```bash
brew install ffmpeg
```

### Slow transcription
- Use a smaller model (tiny or base) for faster results
- Ensure you're using GPU acceleration (shown in app settings)
- Close other resource-intensive applications

### App won't open (macOS Gatekeeper)
Right-click the app and select "Open" to bypass Gatekeeper for unsigned apps.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) - The amazing speech recognition model
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool

---

Made with ❤️ for the transcription community
