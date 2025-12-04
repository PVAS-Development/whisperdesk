import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { app } from 'electron';
import os from 'os';
import type {
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionProgress,
  ModelDownloadProgress,
  ModelInfo,
  GpuInfo,
  QualityLevel,
} from '../../shared/types';
import { detectGpuStatus } from './gpu-detector';

interface WhisperModelInfo {
  size: string;
  url: string;
  quality: QualityLevel;
  speed: string;
}

export const MODELS: Record<string, WhisperModelInfo> = {
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

const MODEL_ALIASES: Record<string, string> = {
  large: 'large-v3',
  turbo: 'large-v3-turbo',
};

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

export function getWhisperBinaryPath(): string {
  if (isDev) {
    return path.join(process.cwd(), 'bin', 'whisper-cli');
  } else {
    const unpackedPath = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'bin',
      'whisper-cli'
    );
    if (fs.existsSync(unpackedPath)) {
      return unpackedPath;
    }
    return path.join(process.resourcesPath, 'bin', 'whisper-cli');
  }
}

export function getModelsDir(): string {
  if (isDev) {
    const devModelsDir = path.join(process.cwd(), 'models');
    if (!fs.existsSync(devModelsDir)) {
      fs.mkdirSync(devModelsDir, { recursive: true });
    }
    return devModelsDir;
  }

  const userDataPath = app.getPath('userData');
  const modelsDir = path.join(userDataPath, 'models');

  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  return modelsDir;
}

export function getModelPath(modelName: string): string {
  if (!MODELS[modelName] && !MODEL_ALIASES[modelName]) {
    throw new Error(`Invalid model name: ${modelName}`);
  }

  if (modelName.includes('/') || modelName.includes('\\') || modelName.includes('..')) {
    throw new Error(`Invalid model name: ${modelName}`);
  }

  const actualModel = MODEL_ALIASES[modelName] || modelName;
  const modelsDir = getModelsDir();
  return path.join(modelsDir, `ggml-${actualModel}.bin`);
}

export function isModelDownloaded(modelName: string): boolean {
  try {
    const modelPath = getModelPath(modelName);
    return fs.existsSync(modelPath);
  } catch {
    return false;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function getActualModelSize(modelName: string): string | null {
  try {
    const modelPath = getModelPath(modelName);
    if (fs.existsSync(modelPath)) {
      const stats = fs.statSync(modelPath);
      return formatFileSize(stats.size);
    }
    return null;
  } catch {
    return null;
  }
}

export function listModels(): ModelInfo[] {
  const result: ModelInfo[] = [];

  for (const [name, info] of Object.entries(MODELS)) {
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

  result.sort((a, b) => a.quality - b.quality);

  return result;
}

export function downloadModel(
  modelName: string,
  onProgress?: (progress: ModelDownloadProgress) => void
): Promise<{ success: boolean; model: string; path: string }> {
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

    const downloadWithRedirects = (url: string, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      https
        .get(url, (response) => {
          // Handle redirects
          if (
            response.statusCode &&
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

          const totalSize = parseInt(response.headers['content-length'] || '0', 10);
          let downloadedSize = 0;
          const startTime = Date.now();
          let lastUpdateTime = 0;
          const updateThrottle = 1000;

          response.on('data', (chunk) => {
            downloadedSize += chunk.length;
            file.write(chunk);

            if (onProgress && totalSize) {
              const now = Date.now();
              if (lastUpdateTime === 0 || now - lastUpdateTime >= updateThrottle) {
                lastUpdateTime = now;
                const percent = Math.round((downloadedSize / totalSize) * 100);

                const elapsedTime = (lastUpdateTime - startTime) / 1000;
                const speed = downloadedSize / elapsedTime;
                const remainingBytes = totalSize - downloadedSize;
                const remainingSeconds = remainingBytes / speed;

                let remainingTime = '';
                if (speed > 0 && Number.isFinite(remainingSeconds) && remainingSeconds > 0) {
                  if (remainingSeconds < 60) {
                    remainingTime = `${Math.round(remainingSeconds)}s`;
                  } else {
                    remainingTime = `${Math.round(remainingSeconds / 60)}m`;
                  }
                } else {
                  remainingTime = '';
                }

                onProgress({
                  status: 'downloading',
                  model: actualModel,
                  percent,
                  downloaded: formatFileSize(downloadedSize),
                  total: formatFileSize(totalSize),
                  remainingTime,
                });
              }
            }
          });

          response.on('end', () => {
            file.end();
            fs.renameSync(tempPath, modelPath);
            resolve({ success: true, model: actualModel, path: modelPath });
          });

          response.on('error', (err) => {
            file.end();
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
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

export function deleteModel(modelName: string): { success: boolean; error?: string } {
  try {
    const modelPath = getModelPath(modelName);
    const modelsDir = getModelsDir();

    const resolvedPath = path.resolve(modelPath);
    const resolvedModelsDir = path.resolve(modelsDir);

    if (!resolvedPath.startsWith(resolvedModelsDir)) {
      return { success: false, error: 'Invalid model path' };
    }

    if (fs.existsSync(modelPath)) {
      fs.unlinkSync(modelPath);
      return { success: true };
    }
    return { success: false, error: 'Model not found' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function checkGpuStatus(): GpuInfo {
  return detectGpuStatus();
}

function convertToWav(inputPath: string, outputPath: string): Promise<string> {
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

    proc.on('error', (_err) => {
      reject(new Error(`FFmpeg not found. Please install: brew install ffmpeg`));
    });
  });
}

export function transcribe(
  options: TranscriptionOptions,
  onProgress?: (progress: TranscriptionProgress) => void
): Promise<TranscriptionResult> & { cancel?: () => void } {
  const { filePath, model, language, outputFormat } = options;
  let proc: ChildProcess | null = null;
  let cancelled = false;

  const promise = new Promise<TranscriptionResult>((resolve, reject) => {
    const run = async () => {
      const whisperPath = getWhisperBinaryPath();

      if (!fs.existsSync(whisperPath)) {
        reject(new Error('whisper.cpp binary not found. Please run: npm run setup:whisper'));
        return;
      }

      const actualModel = MODEL_ALIASES[model] || model || 'base';
      let modelPath;
      try {
        modelPath = getModelPath(actualModel);
      } catch (err) {
        reject(new Error(`Invalid model: ${err instanceof Error ? err.message : String(err)}`));
        return;
      }

      if (!fs.existsSync(modelPath)) {
        reject(new Error(`Model '${actualModel}' not downloaded. Please download it first.`));
        return;
      }

      if (!fs.existsSync(filePath)) {
        reject(new Error(`Input file not found: ${filePath}`));
        return;
      }

      onProgress?.({ percent: 5, status: 'Preparing audio...' });

      const ext = path.extname(filePath).toLowerCase();
      let audioPath = filePath;
      let tempWavPath: string | null = null;

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

      const cpuCount = os.cpus().length;
      args.push('-t', String(Math.min(cpuCount, 8)));

      const child = spawn(whisperPath, args);
      proc = child;

      if (!child.stdout || !child.stderr) {
        reject(new Error('Failed to spawn whisper process'));
        return;
      }

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data: Buffer) => {
        const message = data.toString();
        stderr += message;

        const progressMatch = message.match(/progress\s*=\s*(\d+)%/);
        if (progressMatch && progressMatch[1]) {
          const percent = parseInt(progressMatch[1], 10);
          const scaledPercent = 20 + Math.round((percent / 100) * 70);
          onProgress?.({ percent: scaledPercent, status: `Transcribing... ${percent}%` });
        }
      });

      child.on('close', (code: number) => {
        if (tempWavPath && fs.existsSync(tempWavPath)) {
          fs.unlinkSync(tempWavPath);
        }

        if (cancelled) {
          resolve({ success: true, cancelled: true, text: '' });
          return;
        }

        if (code === 0) {
          const baseName = audioPath.replace(/\.[^/.]+$/, '');
          let txtPath = baseName + '.txt';
          let vttPath = baseName + '.vtt';

          if (!fs.existsSync(txtPath) && fs.existsSync(audioPath + '.txt')) {
            txtPath = audioPath + '.txt';
          }
          if (!fs.existsSync(vttPath) && fs.existsSync(audioPath + '.vtt')) {
            vttPath = audioPath + '.vtt';
          }

          let text = stdout.trim();

          if (fs.existsSync(txtPath)) {
            if (!text) {
              text = fs.readFileSync(txtPath, 'utf-8').trim();
            }
            fs.unlinkSync(txtPath);
          }

          let vtt: string | null = null;
          if (fs.existsSync(vttPath)) {
            vtt = fs.readFileSync(vttPath, 'utf-8');
            fs.unlinkSync(vttPath);
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

      child.on('error', (err: Error) => {
        if (tempWavPath && fs.existsSync(tempWavPath)) {
          fs.unlinkSync(tempWavPath);
        }
        reject(err);
      });
    };
    run();
  }) as Promise<TranscriptionResult> & { cancel?: () => void };

  promise.cancel = () => {
    if (proc) {
      cancelled = true;
      proc.kill();
    }
  };

  return promise;
}
