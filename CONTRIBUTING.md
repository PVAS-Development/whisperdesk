# Contributing to Speakly

Thank you for your interest in contributing to Speakly! We welcome contributions from the community.

## Development Setup

Speakly is an Electron app that uses a native C++ binary (`whisper.cpp`) for transcription.

### Prerequisites

- **Node.js** (v22.12 or later)
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
    git clone https://github.com/Jonathan-Asher/speakly.git
    cd speakly
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Setup whisper.cpp**

    ```bash
    npm run setup:whisper
    ```

4.  **Run in Development Mode**
    ```bash
    npm run electron:dev
    ```

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

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure the test suite passes (`npm test`).
4. Make sure your code lints (`npm run lint`).
5. Submit your Pull Request!

## Reporting & Feedback

- **Bugs:** Open a GitHub issue using the bug report template.
- **Feature ideas:** Start a conversation in [Discussions](https://github.com/Jonathan-Asher/speakly/discussions).
- **Search first:** Browse existing issues and discussions before posting to avoid duplicates.
