# 🎙️ WhisperDesk

[![Downloads](https://img.shields.io/github/downloads/PVAS-Development/whisperdesk/total.svg)](https://github.com/PVAS-Development/whisperdesk/releases)
[![Release Version](https://img.shields.io/github/v/release/PVAS-Development/whisperdesk?label=release&logo=github)](https://github.com/PVAS-Development/whisperdesk/releases)
[![Lint](https://img.shields.io/badge/lint-passing-brightgreen.svg?logo=eslint&logoColor=white)](https://github.com/PVAS-Development/whisperdesk/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/PVAS-Development/whisperdesk?style=social)](https://github.com/PVAS-Development/whisperdesk/stargazers)
[![Forks](https://img.shields.io/github/forks/PVAS-Development/whisperdesk?style=social)](https://github.com/PVAS-Development/whisperdesk/network/members)
[![Good First Issue](https://img.shields.io/github/issues-raw/PVAS-Development/whisperdesk/good%20first%20issue)](https://github.com/PVAS-Development/whisperdesk/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
[![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen.svg?logo=github)](https://github.com/PVAS-Development/whisperdesk/blob/main/CONTRIBUTING.md)

A beautiful, native macOS desktop application for transcribing audio and video files using [whisper.cpp](https://github.com/ggml-org/whisper.cpp).

🌐 **[Visit our website](https://pvas-development.github.io/whisperdesk/)** | 📥 **[Download Latest Release](https://github.com/PVAS-Development/whisperdesk/releases/latest)**

![WhisperDesk Screenshot](src/docs/screenshot.png)

## ✨ Features

- **Drag & Drop** - Drag single or multiple files to create a batch queue
- **Batch Processing** - Process unlimited files sequentially with automatic queue management
- **Queue Persistence + Resume** - Restore unfinished queue items after restarting the app
- **Duplicate File Protection** - Automatically skips duplicates by file path/fingerprint in batch mode
- **Retry Failed Items** - One-click retry for failed or cancelled queue items
- **Live Batch ETA** - See estimated remaining time while batch processing is running
- **Completion Notifications** - Native notification when a batch finishes
- **Multiple Formats** - Supports MP3, WAV, M4A, FLAC, OGG, OPUS, OGA, AMR, WMA, AAC, AIFF, MP4, MOV, AVI, MKV, WebM, WMV, FLV, M4V
- **Embedded Media Preview** - Play the selected audio or video beside your transcript
- **Transcript Navigation** - Click timestamped transcript segments to seek directly to that moment in the media
- **Secure Local Streaming** - Media previews use a private `whisperdesk-media://` protocol with approved local files only
- **Cleaner Subtitles** - Improved VTT/SRT segmentation with better word-boundary splitting for readable captions
- **Multiple Models** - Choose from tiny, base, small, medium, large-v3, or large-v3-turbo Whisper models (including English-only variants)
- **Output Formats** - Export as VTT subtitles, SRT subtitles, plain text, Word (`.docx`), PDF, or Markdown
- **Finder Reveal After Save** - Prompt to reveal the saved transcript directly in Finder
- **Language Support** - Auto-detect or select from 12+ languages
- **Apple Silicon Optimized** - Native Metal GPU acceleration on M1/M2/M3/M4 Macs
- **Dark Mode** - Beautiful dark theme that respects your system preference
- **Auto Updates** - Automatic update notifications when new versions are available
- **Keyboard Shortcuts** - Full keyboard navigation support
- **Transcription History + Search** - Keep track of recent transcriptions and search by file name, content, model, or language
- **Native Performance** - Uses whisper.cpp for fast, efficient transcription
- **TypeScript** - Fully typed codebase for better maintainability
- **Feature-Driven Architecture** - Modular codebase organized by feature domains

## 📋 Requirements

- **macOS** 10.15 (Catalina) or later
- **FFmpeg** (Required for audio processing)
- ~500MB disk space (for whisper.cpp and models)

> **Note:** WhisperDesk requires FFmpeg to process audio files. The app will check for it on startup and guide you if it's missing.

## 🚀 Installation

### 1. Install Prerequisites

WhisperDesk requires **FFmpeg** to be installed on your system to process audio and video files.

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

1. Download the latest `WhisperDesk-x.x.x.dmg` from [Releases](https://github.com/PVAS-Development/whisperdesk/releases)
2. Open the DMG file
3. Drag WhisperDesk to your Applications folder
4. **Important:** Ensure you have FFmpeg installed (see [Prerequisites](#1-install-prerequisites))
5. Launch WhisperDesk from Applications

#### Option B: Build from Source

```bash
# Clone the repository
git clone https://github.com/PVAS-Development/whisperdesk.git
cd whisperdesk

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

## 🎮 Usage

1. **Open Files** - Drag and drop audio/video files (single or batch) into the app, or click to browse
2. **Configure Settings** - Choose your preferred model, language, and output format
3. **Transcribe** - Click "Transcribe" to process the entire queue sequentially
4. **Review with Media** - For timestamped output, play the selected media and click transcript segments to jump to the matching audio/video moment
5. **Save/Copy** - Save the transcription from the save dialog (choose from `.txt`, `.docx`, `.pdf`, `.md`, `.srt`, or `.vtt` formats) or copy to clipboard

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
- **Production**: `~/Library/Application Support/WhisperDesk/models/`

## 🔧 Development

### Prerequisites

- Node.js 22.12+ (use `nvm use` to auto-switch via `.nvmrc`)
- CMake (for building whisper.cpp)
- FFmpeg

### Setup

```bash
# Clone and install
git clone https://github.com/PVAS-Development/whisperdesk.git
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

### Contributing

This project uses **conventional commits** for consistent commit messages.

#### Development Flow

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes** with conventional commits and create PR to `main`

#### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) for clear history:

| Commit Type | Example                    | Description             |
| ----------- | -------------------------- | ----------------------- |
| `feat:`     | `feat: add PDF export`     | New feature             |
| `fix:`      | `fix: crash on startup`    | Bug fix                 |
| `perf:`     | `perf: faster loading`     | Performance improvement |
| `refactor:` | `refactor: simplify logic` | Code refactoring        |
| `docs:`     | `docs: update README`      | Documentation           |
| `chore:`    | `chore: update deps`       | Maintenance             |
| `style:`    | `style: format code`       | Code style              |
| `test:`     | `test: add unit tests`     | Tests                   |
| `ci:`       | `ci: fix workflow`         | CI/CD changes           |
| `build:`    | `build: update config`     | Build changes           |

#### Issues & Discussions

- **Bug report?** Open an issue via the built-in [bug report template](https://github.com/PVAS-Development/whisperdesk/issues/new/choose) so we collect macOS version, WhisperDesk version, reproduction steps, and relevant logs automatically.
- **Feature idea?** Start a thread in [Discussions](https://github.com/PVAS-Development/whisperdesk/discussions). We prefer to explore new ideas there and will only create an issue once we understand the scope.
- **Before you post**: search the existing issues and discussions to avoid duplicates and help us respond faster.

### Testing

WhisperDesk has a comprehensive test suite with **580+ tests** covering utilities, services, hooks, and React components.

#### Run Tests

```bash
# Run all tests once (CI mode)
npm run test:run

# Run tests with watch mode
npm run test

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

#### Test Coverage

- **Unit Tests** - Utilities, formatters, validators, storage, and services
- **Component Tests** - SettingsPanel, FileDropZone, OutputDisplay
- **Service Tests** - Electron API, transcription service, model service, history storage, and secure media authorization
- Test Framework: [Vitest](https://vitest.dev/) with jsdom
- Component Testing: [@testing-library/react](https://testing-library.com/react)
- **Pre-commit Hooks** - Lint and format checks run automatically before every commit (via husky + lint-staged)

#### CI/CD Pipeline

Tests run automatically in GitHub Actions on every PR and push:

- ✅ Linting & formatting checks
- ✅ TypeScript type checking
- ✅ Unit & component tests (580+ tests)
- ✅ Production build validation

### Available Scripts

| Script                            | Description                              |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Start Vite dev server                    |
| `npm run electron:dev`            | Start app in development mode            |
| `npm run setup:whisper`           | Build whisper.cpp (current architecture) |
| `npm run setup:whisper:universal` | Build whisper.cpp (universal binary)     |
| `npm run electron:build`          | Builds macOS DMG (with universal binary) |
| `npm run electron:build:mac`      | Builds macOS DMG (with universal binary) |
| `npm run electron:build:dir`      | Build directory only (faster, testing)   |
| `npm run icons`                   | Generate app icons from SVG              |
| `npm run lint`                    | Run ESLint                               |
| `npm run lint:fix`                | Run ESLint with auto-fix                 |
| `npm run typecheck`               | Run TypeScript type checking             |
| `npm run format`                  | Format code with Prettier                |
| `npm run format:check`            | Check code formatting                    |
| `npm run test`                    | Run tests with watch mode                |
| `npm run test:ui`                 | Run tests with dashboard UI              |
| `npm run test:run`                | Run tests once (CI mode)                 |
| `npm run test:coverage`           | Run tests with coverage report           |

### Architecture

This project follows a modern Electron architecture with strict separation of concerns:

- **`src/main/`**: Electron Main process (TypeScript). Handles OS integration, window management, and native services.
- **`src/preload/`**: Preload scripts (TypeScript). Exposes a secure, typed API to the renderer via `contextBridge`.
- **`src/renderer/`**: React application (TypeScript). The UI layer, built with Vite.
- **`src/shared/`**: Shared types and constants used by both Main and Renderer processes.

**Security Features:**

- **Context Isolation**: Enabled. Renderer cannot access Node.js primitives directly.
- **Sandbox**: Enabled. Renderer runs in a sandboxed environment.
- **IPC**: All communication happens via typed IPC channels defined in `src/main/ipc/`.
- **Media Preview Authorization**: Local previews are limited to user-approved media paths and served through time-bound `whisperdesk-media://` URLs.

### Project Structure

```
whisperdesk/
├── src/
│   ├── main/                # Electron Main process (TypeScript)
│   │   ├── index.ts         # Entry point
│   │   ├── ipc/             # IPC Handlers
│   │   ├── services/        # Business logic (Whisper, FileSystem)
│   │   └── utils/           # Utilities
│   ├── preload/             # Preload scripts (TypeScript)
│   │   └── index.ts         # Secure API exposure
│   ├── renderer/            # React frontend (TypeScript)
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # React entry point
│   │   ├── components/      # Shared UI components
│   │   ├── features/        # Feature-based modules
│   │   └── ...
│   └── shared/              # Shared types and constants
├── dist-electron/           # Output folder for main process build
├── dist/                    # Output folder for renderer build
├── scripts/                 # Build and setup scripts
├── bin/                     # whisper-cli binary (built)
└── models/                  # Downloaded GGML models (dev)
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

The app is **code-signed and notarized** by Apple, so it should open normally. If you still see a warning:

1. Right-click the app and select "Open"
2. Click "Open" in the dialog that appears

For builds from source (unsigned), you may need to run:

```bash
xattr -cr /Applications/WhisperDesk.app
```

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:

- Setting up your development environment
- Code style and commit conventions
- Submitting pull requests

## 🔒 Privacy & Security

- **Local Processing**: All audio/video processing happens **locally** on your device. Your files never leave your computer.
- **No Cloud Uploads**: We do not upload your media files or transcriptions to any server.
- **Private Media Preview**: Transcript playback uses local, approved media files only. Preview URLs are temporary and are not raw filesystem paths.
- **Anonymous Analytics**: We collect minimal, anonymous usage data (e.g., app launches, feature usage) to improve the app. No personal data or file content is collected.
- **Code Signing**: The app is **code-signed and notarized** by Apple for your safety.

For more details, please read our [Privacy Policy](https://whisperdesk.org/privacy.html).

## ☕ Support the Project

WhisperDesk is free and open-source software. If you find it useful, please consider supporting its development:

- [**Donate via PayPal**](https://www.paypal.com/donate/?hosted_button_id=HTJXGMEGMWWD6)
- [**Buy me a coffee**](https://www.buymeacoffee.com/pedrovsiqueira)

Your support helps cover the costs of Apple Developer Program fees and keeps the project alive!

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) - High-performance C++ port of OpenAI Whisper
- [OpenAI Whisper](https://github.com/openai/whisper) - The amazing speech recognition model
- [Electron](https://www.electronjs.org/) - Cross-platform desktop apps
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Fast unit testing framework

---

Made with ❤️ for the transcription community
