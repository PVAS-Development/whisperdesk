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

### Contributing

This project uses a **release branch workflow** with **automated releases**.

#### Development Flow

**For small features** (direct to main):

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes** with conventional commits and create PR to `main`

**For large features** (via release branch):

1. **Create release branch** from `main`:

   ```bash
   git checkout -b release/landing-page
   git push -u origin release/landing-page
   ```

2. **Create feature branches** from the release branch:

   ```bash
   git checkout -b feat/hero-section release/landing-page
   ```

3. **Open PRs to merge features into the release branch**

4. **When ready, open final PR** from `release/landing-page` to `main`

#### CI/CD Flow

- **PRs to main**: Lint, typecheck, format checks
- **Merge to release branch**: Creates prerelease (e.g., `v1.2.0-landing-page.1`)
- **Merge to main**: Creates full release (e.g., `v1.2.0`)

#### Release & Deployment

**After PR is merged** (Automatic):

- [semantic-release](https://semantic-release.gitbook.io/) analyzes commits
- Automatically determines version bump
- Creates GitHub Release with tag
- **Prerelease** for release branches (e.g., `v1.2.0-landing-page.1`)
- **Full release** for main branch (e.g., `v1.2.0`)

**Deploy Release** (Manual - You control when):

- Go to **Actions → Deploy Release** in the GitHub Actions tab
- Click **Run workflow** (top right)
- Enter the version number (e.g., `1.1.0` or `1.2.0-landing-page.1`)
- **Requires your approval** before building
- Once approved: builds macOS app and uploads to release

#### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning:

| Commit Type | Example                 | Version Bump          |
| ----------- | ----------------------- | --------------------- |
| `feat:`     | `feat: add PDF export`  | Minor (1.0.0 → 1.1.0) |
| `feat!:`    | `feat!: redesign API`   | Major (1.0.0 → 2.0.0) |
| `fix:`      | `fix: crash on startup` | Patch (1.0.0 → 1.0.1) |
| `perf:`     | `perf: faster loading`  | Patch                 |
| `refactor:` | -                       | No release            |
| `docs:`     | -                       | No release            |
| `chore:`    | -                       | No release            |
| `style:`    | -                       | No release            |
| `test:`     | -                       | No release            |
| `ci:`       | -                       | No release            |
| `build:`    | -                       | No release            |

### Available Scripts

| Script                       | Description                               |
| ---------------------------- | ----------------------------------------- |
| `npm run dev`                | Start Vite dev server                     |
| `npm run electron:dev`       | Start app in development mode             |
| `npm run setup:whisper`      | Build whisper.cpp and download base model |
| `npm run electron:build`     | Builds macOS DMG                          |
| `npm run electron:build:mac` | Builds macOS DMG                          |
| `npm run icons`              | Generate app icons from SVG               |
| `npm run lint`               | Run ESLint                                |
| `npm run lint:fix`           | Run ESLint with auto-fix                  |
| `npm run typecheck`          | Run TypeScript type checking              |
| `npm run format`             | Format code with Prettier                 |
| `npm run format:check`       | Check code formatting                     |

### GitHub Setup (Branch Protection & Deployments)

After setting up this workflow, configure these GitHub settings for the complete automation:

#### 1. Branch Protection Rules

1. Go to **Settings → Branches → Add rule**
2. Pattern: `main`
3. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass (select: `ci`)
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

#### 2. Production Environment Approval

1. Go to **Settings → Environments → New environment**
2. Name: `production`
3. Add required reviewers (yourself or team)
4. Deploy workflow will pause for approval before building

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
│   ├── contexts/            # React Context providers
│   ├── hooks/               # Shared custom hooks
│   ├── services/            # Shared services (Electron API wrappers)
│   ├── config/              # App configuration & constants
│   ├── types/               # Shared TypeScript types
│   ├── utils/               # Utility functions
│   └── styles/              # Global styles
├── scripts/                 # Build and setup scripts
│   ├── setup-whisper-cpp.sh # Builds whisper.cpp
│   └── generate-icons.js    # Generates app icons
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
