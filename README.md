# 🎙️ WhisperDesk

A beautiful, native macOS desktop application for transcribing audio and video files using [whisper.cpp](https://github.com/ggml-org/whisper.cpp).

![WhisperDesk Screenshot](docs/screenshot.png)

## ✨ Features

- **Drag & Drop** - Simply drag audio/video files into the app
- **Multiple Formats** - Supports MP4, MP3, WAV, M4A, WebM, MOV, AVI, FLAC, OGG, MKV
- **Multiple Models** - Choose from tiny, base, small, medium, or large Whisper models
- **Output Formats** - Export as plain text, SRT subtitles, VTT subtitles, or JSON with timestamps
- **Language Support** - Auto-detect or select from 90+ languages
- **Apple Silicon Optimized** - Native Metal GPU acceleration on M1/M2/M3/M4 Macs
- **Dark Mode** - Beautiful dark theme that respects your system preference
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Transcription History** - Keep track of your recent transcriptions
- **Native Performance** - Uses whisper.cpp for fast, efficient transcription
- **TypeScript** - Fully typed codebase for better maintainability
- **Feature-Driven Architecture** - Modular codebase organized by feature domains

## 📋 Requirements

- **macOS** 10.15 (Catalina) or later
- **FFmpeg** (for audio processing)
- ~500MB disk space (for whisper.cpp and models)

## 🚀 Installation

### 1. Install Prerequisites

#### Install Homebrew (if not already installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Install FFmpeg

```bash
brew install ffmpeg
```

#### Install CMake (for building whisper.cpp)

```bash
brew install cmake
```

### 2. Install WhisperDesk

#### Option A: Download DMG (Recommended)

1. Download the latest `WhisperDesk-x.x.x.dmg` from [Releases](https://github.com/pedrovsiqueira/whisperdesk/releases)
2. Open the DMG file
3. Drag WhisperDesk to your Applications folder
4. Launch WhisperDesk from Applications

#### Option B: Build from Source

```bash
# Clone the repository
git clone https://github.com/pedrovsiqueira/whisperdesk.git
cd whisperdesk

# Install dependencies
npm install

# Build whisper.cpp with Metal support (downloads base model)
npm run setup:whisper

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

| Shortcut     | Action               |
| ------------ | -------------------- |
| `Cmd+O`      | Open file            |
| `Cmd+S`      | Save transcription   |
| `Cmd+C`      | Copy transcription   |
| `Cmd+Return` | Start transcription  |
| `Cmd+H`      | Toggle history       |
| `Escape`     | Cancel transcription |

## 🧠 Whisper Models

| Model    | Size   | Speed | Quality | Best For               |
| -------- | ------ | ----- | ------- | ---------------------- |
| `tiny`   | 39 MB  | ~32x  | ★☆☆☆☆   | Quick drafts, testing  |
| `base`   | 74 MB  | ~16x  | ★★☆☆☆   | Fast transcription     |
| `small`  | 244 MB | ~6x   | ★★★☆☆   | Balanced speed/quality |
| `medium` | 769 MB | ~2x   | ★★★★☆   | High quality           |
| `large`  | 1.5 GB | ~1x   | ★★★★★   | Best quality           |

Models are downloaded automatically on first use and cached in `~/.cache/whisper/`.

## 🔧 Development

### Prerequisites

- Node.js 18+
- CMake (for building whisper.cpp)
- FFmpeg

### Setup

```bash
# Clone and install
git clone https://github.com/pedrovsiqueira/whisperdesk.git
cd whisperdesk
npm install

# Build whisper.cpp and download base model
npm run setup:whisper

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

| Script                       | Description                               |
| ---------------------------- | ----------------------------------------- |
| `npm run dev`                | Start Vite dev server                     |
| `npm run electron:dev`       | Start app in development mode             |
| `npm run setup:whisper`      | Build whisper.cpp and download base model |
| `npm run electron:build:mac` | Build macOS DMG (bumps version)           |
| `npm run icons`              | Generate app icons from SVG               |
| `npm run changelog`          | Generate CHANGELOG.md                     |
| `npm run bump:patch`         | Bump patch version                        |
| `npm run bump:minor`         | Bump minor version                        |
| `npm run bump:major`         | Bump major version                        |
| `npm run lint`               | Run ESLint                                |
| `npm run lint:fix`           | Run ESLint with auto-fix                  |
| `npm run typecheck`          | Run TypeScript type checking              |
| `npm run format`             | Format code with Prettier                 |

### Project Structure

```
whisperdesk/
├── electron/                # Electron main process
│   ├── main.cjs             # Main process entry
│   ├── preload.cjs          # Preload scripts for IPC
│   └── whisper-cpp.cjs      # whisper.cpp integration
├── src/                     # React frontend (TypeScript)
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # React entry point
│   ├── components/          # Shared UI components
│   │   ├── ui/              # Reusable UI primitives (ProgressBar, etc.)
│   │   └── layout/          # Layout components
│   ├── features/            # Feature-based modules
│   │   ├── transcription/   # Transcription feature
│   │   │   ├── components/  # Feature-specific components
│   │   │   ├── hooks/       # Feature-specific hooks
│   │   │   ├── services/    # Feature-specific services
│   │   │   └── types/       # Feature-specific types
│   │   ├── settings/        # Settings feature
│   │   ├── history/         # History feature
│   │   └── updates/         # Updates feature
│   ├── hooks/               # Shared custom hooks
│   ├── services/            # Shared services (Electron API wrappers)
│   ├── config/              # App configuration & constants
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Utility functions
│   └── styles/              # Global styles
├── scripts/                 # Build and setup scripts
│   └── setup-whisper-cpp.sh # Builds whisper.cpp
├── bin/                     # whisper-cli binary (built)
├── models/                  # Downloaded GGML models
└── build/                   # Build resources (icons, etc.)
```

## 🐛 Troubleshooting

### "whisper.cpp not found" error

Run the setup script to build whisper.cpp:

```bash
npm run setup:whisper
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

- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) - High-performance C++ port of OpenAI Whisper
- [OpenAI Whisper](https://github.com/openai/whisper) - The amazing speech recognition model
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool

---

Made with ❤️ for the transcription community
