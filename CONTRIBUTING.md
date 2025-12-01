# Contributing to WhisperDesk

Thank you for your interest in contributing to WhisperDesk! We welcome contributions from the community to help make this the best desktop transcription app for macOS.

## Development Setup

WhisperDesk is an Electron app that uses a native C++ binary (`whisper.cpp`) for transcription. Because of this native dependency, the setup process has one extra step compared to a standard web project.

### Prerequisites

- **Node.js** (v18 or later recommended)
- **macOS** (Required for Metal GPU acceleration support)
- **Xcode Command Line Tools** (for compiling whisper.cpp)
  ```bash
  xcode-select --install
  ```
- **CMake** (Required for building whisper.cpp)
  ```bash
  brew install cmake
  ```
- **FFmpeg** (Required for audio processing)
  ```bash
  brew install ffmpeg
  ```

### Getting Started

1.  **Clone the repository**

    ```bash
    git clone https://github.com/pedrovsiqueira/whisperdesk.git
    cd whisperdesk
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Setup whisper.cpp**
    This script downloads the `whisper.cpp` source code and compiles the `whisper-cli` binary with Metal support. It places the binary in the `bin/` directory.

    ```bash
    npm run setup:whisper
    ```

4.  **Run in Development Mode**
    This starts both the Vite dev server (renderer) and the Electron main process.
    ```bash
    npm run electron:dev
    ```

## Project Structure

- **`electron/`**: Main process code (Node.js). Handles native OS integration and spawning the whisper binary.
- **`src/`**: Renderer process code (React + TypeScript).
  - **`features/`**: Feature-based architecture. Most UI logic lives here.
  - **`services/`**: Shared services, including the `electronAPI` bridge.
- **`scripts/`**: Build and setup scripts.

## Code Style

We use **ESLint** and **Prettier** to maintain code quality.

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Type Checking**: `npm run typecheck`

Please ensure all checks pass before submitting a Pull Request.

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to automate versioning and changelogs.

- `feat: ...` for new features
- `fix: ...` for bug fixes
- `docs: ...` for documentation changes
- `refactor: ...` for code refactoring
- `chore: ...` for maintenance tasks

## Pull Request Process

1.  Fork the repository and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  Ensure the test suite passes (`npm test`).
4.  Make sure your code lints (`npm run lint`).
5.  Issue that Pull Request!
