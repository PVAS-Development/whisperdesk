# Speakly

[![Release Version](https://img.shields.io/github/v/release/Jonathan-Asher/speakly?label=release&logo=github)](https://github.com/Jonathan-Asher/speakly/releases)
[![Downloads](https://img.shields.io/github/downloads/Jonathan-Asher/speakly/total.svg)](https://github.com/Jonathan-Asher/speakly/releases)
[![Stars](https://img.shields.io/github/stars/Jonathan-Asher/speakly?style=social)](https://github.com/Jonathan-Asher/speakly/stargazers)

Speech to text, instantly — a native macOS desktop application powered by [whisper.cpp](https://github.com/ggml-org/whisper.cpp).

📥 **[Download Latest Release](https://github.com/Jonathan-Asher/speakly/releases/latest)**

## Features

- **Tab-Based Layout** — Transcribe, Settings, and History in clean separate tabs
- **Drag & Drop** — Drag single or multiple files to create a batch queue
- **Batch Processing** — Process unlimited files sequentially with automatic queue management
- **Hold-to-Transcribe** — Global shortcut to record and transcribe from any app
- **Multi-Provider Translation** — Translate transcriptions via Google Translate, OpenAI, Groq, Anthropic, or custom endpoints
- **Multiple Formats** — Supports MP3, WAV, M4A, FLAC, OGG, WMA, AAC, AIFF, MP4, MOV, AVI, MKV, WebM, WMV, FLV, M4V
- **Multiple Models** — Choose from tiny, base, small, medium, large-v3, or large-v3-turbo Whisper models (including English-only variants)
- **Output Formats** — Export as VTT, SRT, plain text, Word (`.docx`), PDF, or Markdown
- **Language Support** — Auto-detect or select from 12+ languages
- **Apple Silicon Optimized** — Native Metal GPU acceleration on M1/M2/M3/M4 Macs
- **System Tray** — Minimize to tray, stays running in the background
- **Dark Mode** — Beautiful dark theme with indigo accent color
- **Auto Updates** — Automatic update notifications
- **Transcription History** — Browse and revisit past transcriptions
- **Native Performance** — Uses whisper.cpp for fast, efficient transcription

## Requirements

- **macOS** 10.15 (Catalina) or later
- **FFmpeg** (required for audio processing)
- ~500MB disk space (for whisper.cpp and models)

> Speakly requires FFmpeg to process audio files. The app will check for it on startup and guide you if it's missing.

## Installation

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

### 2. Install Speakly

#### Option A: Download DMG (Recommended)

1. Download the latest `Speakly-x.x.x.dmg` from [Releases](https://github.com/Jonathan-Asher/speakly/releases)
2. Open the DMG file
3. Drag Speakly to your Applications folder
4. Ensure you have FFmpeg installed (see [Prerequisites](#1-install-prerequisites))
5. Launch Speakly from Applications

#### Option B: Build from Source

```bash
# Clone the repository
git clone https://github.com/Jonathan-Asher/speakly.git
cd speakly

# Install dependencies
npm install

# Build whisper.cpp with Metal support (downloads base model)
# For development (current architecture only):
npm run setup:whisper

# For production (universal binary - Intel + Apple Silicon):
npm run setup:whisper:universal

# Run in development mode
npm run electron:dev

# Or build for production (automatically builds universal binary)
npm run electron:build
```

## Usage

1. **Open Files** — Drag and drop audio/video files into the Transcribe tab, or click to browse
2. **Configure Settings** — Switch to Settings tab to choose model, language, and output format
3. **Transcribe** — Click "Transcribe" to process the queue
4. **Save/Copy** — Save the transcription (`.txt`, `.docx`, `.pdf`, `.md`, `.srt`, `.vtt`) or copy to clipboard

### Keyboard Shortcuts

| Shortcut     | Action               |
| ------------ | -------------------- |
| `Cmd+O`      | Open file            |
| `Cmd+S`      | Save transcription   |
| `Cmd+C`      | Copy transcription   |
| `Cmd+Return` | Start transcription  |
| `Cmd+H`      | Toggle history       |
| `Escape`     | Cancel transcription |

## Whisper Models

| Model            | Size   | Speed | Quality | Best For               |
| ---------------- | ------ | ----- | ------- | ---------------------- |
| `tiny`           | 75 MB  | ~10x  | ★☆☆☆☆   | Quick drafts, testing  |
| `base`           | 142 MB | ~7x   | ★★☆☆☆   | Fast transcription     |
| `small`          | 466 MB | ~4x   | ★★★☆☆   | Balanced speed/quality |
| `medium`         | 1.5 GB | ~2x   | ★★★★☆   | High quality           |
| `large-v3`       | 3.1 GB | ~1x   | ★★★★★   | Best quality           |
| `large-v3-turbo` | 1.6 GB | ~2x   | ★★★★★   | Fast + quality         |

English-only variants (`.en`) are available for tiny, base, small, and medium models.

Models are downloaded automatically on first use and cached in:

- **Development**: `PROJECT_ROOT/models/`
- **Production**: `~/Library/Application Support/Speakly/models/`

## Development

### Prerequisites

- Node.js 22.12+ (use `nvm use` to auto-switch via `.nvmrc`)
- CMake (for building whisper.cpp)
- FFmpeg

### Setup

```bash
git clone https://github.com/Jonathan-Asher/speakly.git
cd speakly
npm install
npm run setup:whisper
npm run electron:dev
```

### Building

```bash
# Build for macOS
npm run electron:build:mac

# Build directory only (faster, for testing)
npm run electron:build:dir
```

### Testing

```bash
# Run all tests once
npm run test:run

# Run tests with watch mode
npm run test

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Available Scripts

| Script                            | Description                              |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Start Vite dev server                    |
| `npm run electron:dev`            | Start app in development mode            |
| `npm run setup:whisper`           | Build whisper.cpp (current architecture) |
| `npm run setup:whisper:universal` | Build whisper.cpp (universal binary)     |
| `npm run electron:build`          | Build macOS DMG (universal binary)       |
| `npm run electron:build:mac`      | Build macOS DMG (universal binary)       |
| `npm run electron:build:dir`      | Build directory only (faster, testing)   |
| `npm run icons`                   | Generate app icons from SVG              |
| `npm run lint`                    | Run ESLint                               |
| `npm run lint:fix`                | Run ESLint with auto-fix                 |
| `npm run typecheck`               | Run TypeScript type checking             |
| `npm run format`                  | Format code with Prettier                |
| `npm run test`                    | Run tests with watch mode                |
| `npm run test:run`                | Run tests once (CI mode)                 |
| `npm run test:coverage`           | Run tests with coverage report           |

### Architecture

This project follows a modern Electron architecture with strict separation of concerns:

- **`src/main/`** — Electron Main process. Handles OS integration, window management, and native services.
- **`src/preload/`** — Preload scripts. Exposes a secure, typed API to the renderer via `contextBridge`.
- **`src/renderer/`** — React application. The UI layer, built with Vite.
- **`src/shared/`** — Shared types and constants used by both processes.

**Security:** Context isolation enabled, sandbox enabled, all communication via typed IPC channels.

## Troubleshooting

### "whisper.cpp not found" error

```bash
npm run setup:whisper
```

### "FFmpeg not found" error

```bash
brew install ffmpeg
```

### App won't open (macOS Gatekeeper)

The app is code-signed and notarized. If you still see a warning:

1. Right-click the app and select "Open"
2. Click "Open" in the dialog

For unsigned builds from source:

```bash
xattr -cr /Applications/Speakly.app
```

## Privacy

All audio/video processing happens **locally** on your device. Your files never leave your computer. We collect minimal, anonymous usage data (app launches, feature usage) to improve the app — no personal data or file content is collected.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) — High-performance C++ port of OpenAI Whisper
- [OpenAI Whisper](https://github.com/openai/whisper) — Speech recognition model
- [Electron](https://www.electronjs.org/) — Cross-platform desktop apps
- [React](https://react.dev/) — UI framework
- [TypeScript](https://www.typescriptlang.org/) — Type-safe JavaScript
- [Vite](https://vitejs.dev/) — Build tool
- [Vitest](https://vitest.dev/) — Testing framework
