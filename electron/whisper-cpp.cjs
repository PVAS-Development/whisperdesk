/**
 * WhisperDesk - whisper.cpp Integration
 * Native transcription using whisper.cpp binary
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { app } = require('electron');

// Model information for whisper.cpp GGML models
const MODELS = {
  tiny: {
    size: '75 MB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    quality: 1,
    speed: '~10x',
  },
  'tiny.en': {
    size: '75 MB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
    quality: 1,
    speed: '~10x',
  },
  base: {
    size: '142 MB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    quality: 2,
    speed: '~7x',
  },
  'base.en': {
    size: '142 MB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
    quality: 2,
    speed: '~7x',
  },
  small: {
    size: '466 MB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    quality: 3,
    speed: '~4x',
  },
  'small.en': {
    size: '466 MB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
    quality: 3,
    speed: '~4x',
  },
  medium: {
    size: '1.5 GB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin',
    quality: 4,
    speed: '~2x',
  },
  'medium.en': {
    size: '1.5 GB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.en.bin',
    quality: 4,
    speed: '~2x',
  },
  'large-v3': {
    size: '3.1 GB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    quality: 5,
    speed: '~1x',
  },
  'large-v3-turbo': {
    size: '1.6 GB',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin',
    quality: 5,
    speed: '~2x',
  },
};

// Map old model names to new ones for compatibility
const MODEL_ALIASES = {
  large: 'large-v3',
  turbo: 'large-v3-turbo',
};

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

/**
 * Get the path to the whisper-cli binary
 */
function getWhisperBinaryPath() {
  if (isDev) {
    // Development: look in project bin directory
    return path.join(__dirname, '..', 'bin', 'whisper-cli');
  } else {
    // Production: binaries are unpacked from asar
    // First try app.asar.unpacked (electron-builder's asarUnpack)
    const unpackedPath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'bin',
      'whisper-cli'
    );
    if (fs.existsSync(unpackedPath)) {
      return unpackedPath;
    }
    // Fallback to direct Resources path
    return path.join(process.resourcesPath, 'bin', 'whisper-cli');
  }
}

/**
 * Get the models directory path
 */
function getModelsDir() {
  if (isDev) {
    // Development: use project models directory
    const devModelsDir = path.join(__dirname, '..', 'models');
    if (!fs.existsSync(devModelsDir)) {
      fs.mkdirSync(devModelsDir, { recursive: true });
    }
    return devModelsDir;
  }

  // Production: use app data directory for user-downloaded models
  const userDataPath = app.getPath('userData');
  const modelsDir = path.join(userDataPath, 'models');

  // Ensure directory exists
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  return modelsDir;
}

/**
 * Get the path to a model file
 */
function getModelPath(modelName) {
  // Handle aliases
  const actualModel = MODEL_ALIASES[modelName] || modelName;
  const modelsDir = getModelsDir();
  return path.join(modelsDir, `ggml-${actualModel}.bin`);
}

/**
 * Check if a model is downloaded
 */
function isModelDownloaded(modelName) {
  const modelPath = getModelPath(modelName);
  return fs.existsSync(modelPath);
}

/**
 * Get file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * Get actual file size of downloaded model
 */
function getActualModelSize(modelName) {
  const modelPath = getModelPath(modelName);
  if (fs.existsSync(modelPath)) {
    const stats = fs.statSync(modelPath);
    return formatFileSize(stats.size);
  }
  return null;
}

/**
 * List all models with their status
 */
function listModels() {
  const result = [];

  for (const [name, info] of Object.entries(MODELS)) {
    // Skip .en variants in the main list (they're options)
    if (name.includes('.en')) continue;

    const downloaded = isModelDownloaded(name);
    const actualSize = downloaded ? getActualModelSize(name) : null;

    result.push({
      name,
      size: actualSize || info.size,
      quality: info.quality,
      speed: info.speed,
      downloaded,
      vram: 'N/A (CPU/Metal)', // whisper.cpp uses different memory model
    });
  }

  // Sort by quality
  result.sort((a, b) => a.quality - b.quality);

  return result;
}

/**
 * Download a model from HuggingFace
 */
function downloadModel(modelName, onProgress) {
  return new Promise((resolve, reject) => {
    const actualModel = MODEL_ALIASES[modelName] || modelName;
    const modelInfo = MODELS[actualModel];

    if (!modelInfo) {
      reject(new Error(`Unknown model: ${modelName}`));
      return;
    }

    const modelPath = getModelPath(actualModel);
    const tempPath = modelPath + '.tmp';

    // Create write stream
    const file = fs.createWriteStream(tempPath);

    const downloadWithRedirects = (url, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      https
        .get(url, (response) => {
          // Handle redirects
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            downloadWithRedirects(response.headers.location, redirectCount + 1);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
            return;
          }

          const totalSize = parseInt(response.headers['content-length'], 10);
          let downloadedSize = 0;

          response.on('data', (chunk) => {
            downloadedSize += chunk.length;
            file.write(chunk);

            if (onProgress && totalSize) {
              const percent = Math.round((downloadedSize / totalSize) * 100);
              onProgress({
                percent,
                downloaded: formatFileSize(downloadedSize),
                total: formatFileSize(totalSize),
              });
            }
          });

          response.on('end', () => {
            file.end();
            // Rename temp file to final name
            fs.renameSync(tempPath, modelPath);
            resolve({ success: true, model: actualModel, path: modelPath });
          });

          response.on('error', (err) => {
            file.end();
            fs.unlinkSync(tempPath);
            reject(err);
          });
        })
        .on('error', (err) => {
          reject(err);
        });
    };

    downloadWithRedirects(modelInfo.url);
  });
}

/**
 * Delete a downloaded model
 */
function deleteModel(modelName) {
  const modelPath = getModelPath(modelName);
  if (fs.existsSync(modelPath)) {
    fs.unlinkSync(modelPath);
    return { success: true };
  }
  return { success: false, error: 'Model not found' };
}

/**
 * Check GPU/Metal availability
 */
function checkGpuStatus() {
  // On macOS, whisper.cpp automatically uses Metal when available
  const platform = process.platform;

  if (platform === 'darwin') {
    // Check if running on Apple Silicon or has AMD GPU
    try {
      const { execSync } = require('child_process');
      const cpuInfo = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf-8' });

      if (cpuInfo.includes('Apple')) {
        return {
          available: true,
          type: 'metal',
          name: 'Apple Silicon (Metal)',
        };
      } else {
        return {
          available: true,
          type: 'metal',
          name: 'macOS Metal (GPU acceleration available)',
        };
      }
    } catch (e) {
      return {
        available: false,
        type: 'cpu',
        name: 'CPU only',
      };
    }
  }

  return {
    available: false,
    type: 'cpu',
    name: 'CPU only',
  };
}

/**
 * Convert audio file to WAV format using ffmpeg
 */
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ffmpegPaths = [
      '/opt/homebrew/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      '/usr/bin/ffmpeg',
      'ffmpeg',
    ];

    let ffmpegPath = 'ffmpeg';
    for (const p of ffmpegPaths) {
      if (p === 'ffmpeg' || fs.existsSync(p)) {
        ffmpegPath = p;
        break;
      }
    }

    const args = [
      '-i',
      inputPath,
      '-ar',
      '16000', // 16kHz sample rate (required by Whisper)
      '-ac',
      '1', // Mono
      '-c:a',
      'pcm_s16le', // 16-bit PCM
      '-y', // Overwrite output
      outputPath,
    ];

    const proc = spawn(ffmpegPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg conversion failed: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg not found. Please install: brew install ffmpeg`));
    });
  });
}

/**
 * Transcribe audio using whisper.cpp
 */
function transcribe(options, onProgress) {
  const { filePath, model, language, outputFormat } = options;

  return new Promise(async (resolve, reject) => {
    const whisperPath = getWhisperBinaryPath();

    // Check if whisper binary exists
    if (!fs.existsSync(whisperPath)) {
      reject(new Error('whisper.cpp binary not found. Please run: npm run setup:whisper'));
      return;
    }

    // Get model path
    const actualModel = MODEL_ALIASES[model] || model || 'base';
    const modelPath = getModelPath(actualModel);

    // Check if model is downloaded
    if (!fs.existsSync(modelPath)) {
      reject(new Error(`Model '${actualModel}' not downloaded. Please download it first.`));
      return;
    }

    // Check if input file exists
    if (!fs.existsSync(filePath)) {
      reject(new Error(`Input file not found: ${filePath}`));
      return;
    }

    onProgress?.({ percent: 5, status: 'Preparing audio...' });

    // Convert to WAV if needed (whisper.cpp only supports WAV)
    const ext = path.extname(filePath).toLowerCase();
    let audioPath = filePath;
    let tempWavPath = null;

    if (ext !== '.wav') {
      tempWavPath = path.join(app.getPath('temp'), `whisperdesk_${Date.now()}.wav`);
      try {
        audioPath = await convertToWav(filePath, tempWavPath);
        onProgress?.({ percent: 15, status: 'Audio converted. Starting transcription...' });
      } catch (err) {
        reject(err);
        return;
      }
    }

    onProgress?.({ percent: 20, status: 'Transcribing...' });

    // Build whisper-cli arguments
    const args = [
      '-m',
      modelPath,
      '-f',
      audioPath,
      '--output-txt', // Output plain text
      '--output-vtt', // Output VTT subtitles
      '--no-timestamps', // Don't print timestamps in main output (we use VTT)
      '-pp', // Print progress
    ];

    // Add language if specified
    if (language && language !== 'auto') {
      args.push('-l', language);
    }

    // Number of threads (use available cores)
    const cpuCount = require('os').cpus().length;
    args.push('-t', String(Math.min(cpuCount, 8)));

    const proc = spawn(whisperPath, args);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      const message = data.toString();
      stderr += message;

      // Parse progress from whisper.cpp output
      // whisper.cpp prints progress like: "progress = XX%"
      const progressMatch = message.match(/progress\s*=\s*(\d+)%/);
      if (progressMatch) {
        const percent = parseInt(progressMatch[1], 10);
        // Scale from 20-90%
        const scaledPercent = 20 + Math.round((percent / 100) * 70);
        onProgress?.({ percent: scaledPercent, status: `Transcribing... ${percent}%` });
      }
    });

    proc.on('close', (code) => {
      // Clean up temp file
      if (tempWavPath && fs.existsSync(tempWavPath)) {
        fs.unlinkSync(tempWavPath);
      }

      if (code === 0) {
        // Read output files
        const baseName = audioPath.replace(/\.[^/.]+$/, '');
        const txtPath = baseName + '.txt';
        const vttPath = baseName + '.vtt';

        let text = stdout.trim();

        // Try to read from output files if stdout is empty
        if (!text && fs.existsSync(txtPath)) {
          text = fs.readFileSync(txtPath, 'utf-8').trim();
          fs.unlinkSync(txtPath); // Clean up
        }

        let vtt = null;
        if (fs.existsSync(vttPath)) {
          vtt = fs.readFileSync(vttPath, 'utf-8');
          fs.unlinkSync(vttPath); // Clean up
        }

        if (!text && !vtt) {
          reject(new Error('Transcription produced no output'));
          return;
        }

        onProgress?.({ percent: 100, status: 'Complete!' });

        // Return VTT format if requested, otherwise text
        resolve({
          success: true,
          text: outputFormat === 'vtt' && vtt ? vtt : text,
        });
      } else {
        reject(new Error(stderr || 'Transcription failed'));
      }
    });

    proc.on('error', (err) => {
      // Clean up temp file
      if (tempWavPath && fs.existsSync(tempWavPath)) {
        fs.unlinkSync(tempWavPath);
      }
      reject(err);
    });

    // Return the process so it can be cancelled
    return proc;
  });
}

module.exports = {
  MODELS,
  getWhisperBinaryPath,
  getModelsDir,
  getModelPath,
  isModelDownloaded,
  listModels,
  downloadModel,
  deleteModel,
  checkGpuStatus,
  transcribe,
};
