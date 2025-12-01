#!/bin/bash
# Setup whisper.cpp for WhisperDesk
# Downloads and builds whisper.cpp with Metal support for macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WHISPER_CPP_DIR="$PROJECT_DIR/whisper.cpp"
BIN_DIR="$PROJECT_DIR/bin"

echo "🔧 Setting up whisper.cpp for WhisperDesk..."

# Check for required tools
if ! command -v cmake &> /dev/null; then
    echo "❌ cmake is required. Install with: brew install cmake"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ git is required"
    exit 1
fi

# Clone or update whisper.cpp
if [ -d "$WHISPER_CPP_DIR" ]; then
    echo "📦 Updating whisper.cpp..."
    cd "$WHISPER_CPP_DIR"
    git pull --ff-only || true
else
    echo "📥 Cloning whisper.cpp..."
    git clone https://github.com/ggml-org/whisper.cpp.git "$WHISPER_CPP_DIR"
    cd "$WHISPER_CPP_DIR"
fi

# Build with Metal support (for Apple Silicon/macOS)
echo "🔨 Building whisper.cpp with Metal support..."
mkdir -p build
cd build

# Configure with Metal support
cmake .. \
    -DWHISPER_METAL=ON \
    -DCMAKE_BUILD_TYPE=Release

# Build
cmake --build . --config Release -j$(sysctl -n hw.ncpu)

# Create bin directory and copy binary
mkdir -p "$BIN_DIR"
cp bin/whisper-cli "$BIN_DIR/whisper-cli"

echo ""
echo "✅ whisper.cpp built successfully!"
echo "   Binary: $BIN_DIR/whisper-cli"
echo ""

# Download base model if not present
MODELS_DIR="$PROJECT_DIR/models"
mkdir -p "$MODELS_DIR"

if [ ! -f "$MODELS_DIR/ggml-base.bin" ]; then
    echo "📥 Downloading base model..."
    cd "$WHISPER_CPP_DIR"
    bash ./models/download-ggml-model.sh base
    mv models/ggml-base.bin "$MODELS_DIR/"
    echo "✅ Base model downloaded to $MODELS_DIR/ggml-base.bin"
fi

echo ""
echo "🎉 Setup complete! You can now run WhisperDesk with whisper.cpp backend."
