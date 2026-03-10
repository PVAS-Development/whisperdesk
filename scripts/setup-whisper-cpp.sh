#!/bin/bash
# Setup whisper.cpp for WhisperDesk
# Downloads and builds whisper.cpp with Metal support for macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WHISPER_CPP_DIR="$PROJECT_DIR/whisper.cpp"
BIN_DIR="$PROJECT_DIR/bin"
DEFAULT_MACOS_DEPLOYMENT_TARGET="12.0"
MACOS_DEPLOYMENT_TARGET="${MACOSX_DEPLOYMENT_TARGET:-$DEFAULT_MACOS_DEPLOYMENT_TARGET}"

# Parse arguments
UNIVERSAL=false
for arg in "$@"; do
    case $arg in
        --universal)
            UNIVERSAL=true
            shift
            ;;
    esac
done

echo "🔧 Setting up whisper.cpp for WhisperDesk..."
echo "🎯 Using macOS deployment target: $MACOS_DEPLOYMENT_TARGET"

# Ensure child build tools pick the same minimum macOS version
export MACOSX_DEPLOYMENT_TARGET="$MACOS_DEPLOYMENT_TARGET"

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

# Create bin directory
mkdir -p "$BIN_DIR"

# Function to build for a specific architecture
build_arch() {
    local arch=$1
    local build_dir="build-$arch"
    
    echo "🔨 Building whisper.cpp for $arch with Metal support..."
    mkdir -p "$build_dir"
    cd "$build_dir"
    
    # Configure with Metal support and STATIC linking
    # BUILD_SHARED_LIBS=OFF ensures static linking of whisper/ggml libraries
    # GGML_NATIVE=OFF disables -march=native which causes issues cross-compiling
    # GGML_ACCELERATE/GGML_BLAS=OFF avoids NEWLAPACK+ILP64 symbols that break on older macOS
    cmake .. \
        -DWHISPER_METAL=ON \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_SHARED_LIBS=OFF \
        -DGGML_NATIVE=OFF \
        -DGGML_ACCELERATE=OFF \
        -DGGML_BLAS=OFF \
        -DCMAKE_OSX_DEPLOYMENT_TARGET="$MACOS_DEPLOYMENT_TARGET" \
        -DCMAKE_OSX_ARCHITECTURES="$arch"
    
    # Build
    cmake --build . --config Release -j$(sysctl -n hw.ncpu)
    
    cd ..
}

if [ "$UNIVERSAL" = true ]; then
    echo "🍎 Building universal binary (arm64 + x86_64)..."
    
    # Build for both architectures
    cd "$WHISPER_CPP_DIR"
    build_arch "arm64"
    cd "$WHISPER_CPP_DIR"
    build_arch "x86_64"
    
    # Create universal binary using lipo
    echo "🔗 Creating universal binary..."
    lipo -create \
        "$WHISPER_CPP_DIR/build-arm64/bin/whisper-cli" \
        "$WHISPER_CPP_DIR/build-x86_64/bin/whisper-cli" \
        -output "$BIN_DIR/whisper-cli"
    
    # Verify the universal binary
    echo "📋 Universal binary architectures:"
    lipo -info "$BIN_DIR/whisper-cli"
else
    # Single architecture build
    echo "🔨 Building whisper.cpp with Metal support..."
    cd "$WHISPER_CPP_DIR"
    mkdir -p build
    cd build
    
    # Configure with Metal support and STATIC linking
    # GGML_NATIVE=OFF for consistent builds
    # GGML_ACCELERATE/GGML_BLAS=OFF avoids NEWLAPACK+ILP64 symbols that break on older macOS
    cmake .. \
        -DWHISPER_METAL=ON \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_SHARED_LIBS=OFF \
        -DGGML_NATIVE=OFF \
        -DGGML_ACCELERATE=OFF \
        -DGGML_BLAS=OFF \
        -DCMAKE_OSX_DEPLOYMENT_TARGET="$MACOS_DEPLOYMENT_TARGET"
    
    # Build
    cmake --build . --config Release -j$(sysctl -n hw.ncpu)
    
    # Copy binary
    cp bin/whisper-cli "$BIN_DIR/whisper-cli"
fi

# Make binary executable
chmod +x "$BIN_DIR/whisper-cli"

echo ""
echo "✅ whisper.cpp built successfully!"
echo "   Binary: $BIN_DIR/whisper-cli"

# Verify the binary has no problematic dylib dependencies
echo ""
echo "📋 Checking binary dependencies..."
otool -L "$BIN_DIR/whisper-cli" | head -20
echo ""

echo "📋 Checking binary compatibility..."
if command -v vtool >/dev/null 2>&1; then
    vtool -show-build "$BIN_DIR/whisper-cli" 2>/dev/null | grep -E "platform|minos|sdk" || true
fi

if nm -m "$BIN_DIR/whisper-cli" 2>/dev/null | grep -q 'NEWLAPACK\|ILP64'; then
    echo "❌ Incompatible Accelerate symbols detected (NEWLAPACK/ILP64)."
    echo "   This binary may fail on older macOS versions."
    exit 1
fi
echo "✅ No NEWLAPACK/ILP64 symbols detected"
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
