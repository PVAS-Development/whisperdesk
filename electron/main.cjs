const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const { autoUpdater } = require('electron-updater');

// Import whisper.cpp module
const whisperCpp = require('./whisper-cpp.cjs');
const {
  generateWordDocument,
  generatePdfDocument,
  generateMarkdownDocument,
} = require('./export-helper.cjs');

let mainWindow;
let whisperProcess = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Auto-updater events
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:checking');
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err.message);
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu:openFile');
          },
        },
        {
          label: 'Save Transcription...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu:saveFile');
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Copy All Transcription',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            mainWindow.webContents.send('menu:copyTranscription');
          },
        },
      ],
    },
    {
      label: 'Transcription',
      submenu: [
        {
          label: 'Start Transcription',
          accelerator: 'CmdOrCtrl+Return',
          click: () => {
            mainWindow.webContents.send('menu:startTranscription');
          },
        },
        {
          label: 'Cancel Transcription',
          accelerator: 'Escape',
          click: () => {
            mainWindow.webContents.send('menu:cancelTranscription');
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle History',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('menu:toggleHistory');
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Check for Updates...',
          click: () => {
            if (isDev) {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Updates',
                message: 'Updates are not available in development mode',
              });
            } else {
              autoUpdater.checkForUpdates();
            }
          },
        },
        { type: 'separator' },
        {
          label: 'About WhisperDesk',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About WhisperDesk',
              message: 'WhisperDesk',
              detail: `Version: ${app.getVersion()}\nA desktop transcription app powered by whisper.cpp`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Enable context menu for text selection (copy/paste)
  mainWindow.webContents.on('context-menu', (event, params) => {
    const { selectionText, isEditable } = params;

    if (selectionText || isEditable) {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Copy', role: 'copy', enabled: !!selectionText },
        { label: 'Select All', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Cut', role: 'cut', enabled: isEditable },
        { label: 'Paste', role: 'paste', enabled: isEditable },
      ]);
      contextMenu.popup();
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createMenu();
  createWindow();
  setupAutoUpdater();

  // Check for updates on startup (only in production)
  // if (!isDev) {
  //   setTimeout(() => {
  //     autoUpdater.checkForUpdates().catch(() => {})
  //   }, 3000)
  // }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Clean up whisper process if running
  if (whisperProcess) {
    console.log('Cleaning up whisper process...');
    whisperProcess.kill('SIGTERM');
    setTimeout(() => {
      if (whisperProcess) {
        whisperProcess.kill('SIGKILL');
      }
    }, 2000);
    whisperProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean up on app quit
app.on('before-quit', () => {
  if (whisperProcess) {
    console.log('App quitting, cleaning up whisper process...');
    whisperProcess.kill('SIGTERM');
    whisperProcess = null;
  }
});

// IPC Handlers

// Open file dialog
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      {
        name: 'Media Files',
        extensions: ['mp4', 'mp3', 'wav', 'm4a', 'webm', 'mov', 'avi', 'flac', 'ogg', 'mkv'],
      },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Save file dialog and write content
ipcMain.handle('dialog:saveFile', async (event, { defaultName, content, format }) => {
  const filters = [];

  switch (format) {
    case 'srt':
      filters.push({ name: 'SRT Subtitles', extensions: ['srt'] });
      break;
    case 'vtt':
      filters.push({ name: 'VTT Subtitles', extensions: ['vtt'] });
      break;
    case 'json':
      filters.push({ name: 'JSON', extensions: ['json'] });
      break;
    case 'docx':
      filters.push({ name: 'Word', extensions: ['docx'] });
      break;
    case 'pdf':
      filters.push({ name: 'PDF', extensions: ['pdf'] });
      break;
    case 'md':
      filters.push({ name: 'Markdown', extensions: ['md'] });
      break;
    default:
      filters.push({ name: 'Text Files', extensions: ['txt'] });
  }
  filters.push({ name: 'All Files', extensions: ['*'] });

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters,
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    // Check disk space before writing (estimate: need at least 10MB free)
    const dir = path.dirname(result.filePath);
    if (!fs.existsSync(dir)) {
      throw new Error('Directory does not exist');
    }

    let finalContent = content;
    const fileName = path.basename(result.filePath, path.extname(result.filePath));

    // Generate document content in main process for formats that need Node.js libraries
    if (format === 'docx') {
      finalContent = await generateWordDocument(content, {
        title: 'Transcription',
        fileName,
      });
    } else if (format === 'pdf') {
      finalContent = await generatePdfDocument(content, {
        title: 'Transcription',
        fileName,
      });
    } else if (format === 'md') {
      finalContent = await generateMarkdownDocument(content, {
        title: 'Transcription',
        fileName,
      });
    }

    // Handle binary content (Buffer) or text content
    if (Buffer.isBuffer(finalContent)) {
      fs.writeFileSync(result.filePath, finalContent);
    } else {
      fs.writeFileSync(result.filePath, finalContent, 'utf-8');
    }

    return { success: true, filePath: result.filePath };
  } catch (err) {
    let errorMessage = err.message;
    if (err.code === 'ENOSPC') {
      errorMessage = 'Insufficient disk space';
    } else if (err.code === 'EACCES' || err.code === 'EPERM') {
      errorMessage = 'Permission denied. Cannot write to this location.';
    }
    return { success: false, error: errorMessage };
  }
});

// Get file info
ipcMain.handle('file:getInfo', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      name: path.basename(filePath),
      path: filePath,
    };
  } catch (err) {
    return null;
  }
});

// Model Management (using whisper.cpp)

// Get list of all models with status
ipcMain.handle('models:list', async () => {
  try {
    const models = whisperCpp.listModels();
    return { models };
  } catch (err) {
    throw new Error(`Failed to get model list: ${err.message}`);
  }
});

// Check GPU status
ipcMain.handle('models:gpuStatus', async () => {
  return whisperCpp.checkGpuStatus();
});

// Download a specific model
ipcMain.handle('models:download', async (event, modelName) => {
  try {
    const result = await whisperCpp.downloadModel(modelName, (progress) => {
      mainWindow.webContents.send('models:downloadProgress', {
        status: 'downloading',
        model: modelName,
        percent: progress.percent,
        downloaded: progress.downloaded,
        total: progress.total,
      });
    });

    mainWindow.webContents.send('models:downloadProgress', {
      status: 'complete',
      model: modelName,
    });

    return result;
  } catch (err) {
    throw new Error(`Failed to download model: ${err.message}`);
  }
});

// Delete a model
ipcMain.handle('models:delete', async (event, modelName) => {
  return whisperCpp.deleteModel(modelName);
});

// Track if user cancelled the transcription
let transcriptionCancelled = false;

/**
 * Convert audio/video file to WAV format using FFmpeg
 */
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Find ffmpeg
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

    console.log('Converting audio with FFmpeg:', ffmpegPath, args.join(' '));

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
        reject(new Error(`FFmpeg conversion failed (code ${code}): ${stderr.slice(-500)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg not found. Please install: brew install ffmpeg`));
    });
  });
}

// Start transcription (using whisper.cpp)
ipcMain.handle('transcribe:start', async (event, options) => {
  const { filePath, model, language, outputFormat } = options;

  // Reset cancellation flag
  transcriptionCancelled = false;

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found. Please select a valid file.');
  }

  // Check if whisper.cpp binary exists
  const whisperBinary = whisperCpp.getWhisperBinaryPath();
  if (!fs.existsSync(whisperBinary)) {
    throw new Error('whisper.cpp not found. Please run: npm run setup:whisper');
  }

  // Check if model is downloaded
  const actualModel = model || 'base';
  if (!whisperCpp.isModelDownloaded(actualModel)) {
    throw new Error(`Model '${actualModel}' not downloaded. Please download it from Settings.`);
  }

  // Create temp paths
  const tempDir = require('os').tmpdir();
  const outputBaseName = `whisperdesk_${Date.now()}`;
  const outputPath = path.join(tempDir, outputBaseName);
  const tempWavPath = path.join(tempDir, `${outputBaseName}.wav`);

  // Check if we need to convert the audio
  // whisper.cpp supports: flac, mp3, ogg, wav
  const ext = path.extname(filePath).toLowerCase();
  const supportedFormats = ['.wav', '.mp3', '.ogg', '.flac'];
  let audioPath = filePath;
  let needsCleanup = false;

  if (!supportedFormats.includes(ext)) {
    // Need to convert to WAV first
    console.log(`Converting ${ext} to WAV...`);
    mainWindow?.webContents.send('transcribe:progress', {
      percent: 5,
      status: 'Converting audio format...',
    });

    try {
      audioPath = await convertToWav(filePath, tempWavPath);
      needsCleanup = true;
      console.log('Audio converted to:', audioPath);
    } catch (err) {
      throw new Error(`Failed to convert audio: ${err.message}`);
    }
  }

  return new Promise((resolve, reject) => {
    // Build whisper-cli arguments
    const modelPath = whisperCpp.getModelPath(actualModel);
    const cpuCount = require('os').cpus().length;

    const args = [
      '-m',
      modelPath,
      '-f',
      audioPath, // Use converted audio path
      '-t',
      String(Math.min(cpuCount, 8)),
      '-of',
      outputPath, // Output file base name
      '-ovtt', // Output VTT format
      '-pp', // Print progress
    ];

    if (language && language !== 'auto') {
      args.push('-l', language);
    }

    console.log('Running whisper-cli with args:', args);

    try {
      whisperProcess = spawn(whisperBinary, args);
    } catch (err) {
      reject(new Error(`Failed to start whisper.cpp: ${err.message}`));
      return;
    }

    let stdout = '';
    let stderr = '';

    whisperProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    whisperProcess.stderr.on('data', (data) => {
      const message = data.toString();
      stderr += message;

      // Parse progress from whisper.cpp output
      const progressMatch = message.match(/progress\s*=\s*(\d+)%/);
      if (progressMatch) {
        const percent = parseInt(progressMatch[1], 10);
        mainWindow.webContents.send('transcribe:progress', {
          percent: 10 + Math.round((percent / 100) * 85),
          status: `Transcribing... ${percent}%`,
        });
      }
    });

    // Cleanup function for temp files
    const cleanup = () => {
      if (needsCleanup && fs.existsSync(tempWavPath)) {
        try {
          fs.unlinkSync(tempWavPath);
          console.log('Cleaned up temp WAV:', tempWavPath);
        } catch (e) {
          console.error('Failed to cleanup temp WAV:', e);
        }
      }
    };

    whisperProcess.on('close', (code) => {
      whisperProcess = null;
      cleanup();

      if (code === 0) {
        // Read VTT output file
        const vttPath = outputPath + '.vtt';
        let text = '';

        console.log('Looking for VTT at:', vttPath);

        if (fs.existsSync(vttPath)) {
          text = fs.readFileSync(vttPath, 'utf-8');
          fs.unlinkSync(vttPath); // Clean up
          console.log('VTT content length:', text.length);
        } else {
          // Fallback: try to extract transcription from stderr
          // whisper.cpp prints timestamped text to stderr
          const lines = stderr.split('\n');
          const transcriptionLines = lines.filter((line) => line.match(/^\[[\d:.]+ --> [\d:.]+\]/));
          if (transcriptionLines.length > 0) {
            text = transcriptionLines.join('\n');
          }
        }

        if (!text) {
          reject(new Error('Transcription produced no output'));
        } else {
          resolve({ success: true, text });
        }
      } else if (transcriptionCancelled || code === 130 || code === 143) {
        // User cancelled - resolve gracefully instead of rejecting
        resolve({ success: false, cancelled: true });
      } else {
        reject(new Error(stderr || 'Transcription failed'));
      }
    });

    whisperProcess.on('error', (err) => {
      whisperProcess = null;
      cleanup();
      let errorMsg = 'Failed to start transcription process';
      if (err.code === 'ENOENT') {
        errorMsg = 'whisper.cpp not found. Please run: npm run setup:whisper';
      } else if (err.code === 'EACCES') {
        errorMsg = 'Permission denied. Cannot execute whisper.cpp.';
      } else {
        errorMsg = `Process error: ${err.message}`;
      }
      reject(new Error(errorMsg));
    });

    // Set timeout for very long transcriptions (4 hours)
    const timeout = setTimeout(
      () => {
        if (whisperProcess) {
          whisperProcess.kill('SIGTERM');
          whisperProcess = null;
          reject(new Error('Transcription timeout (4 hours exceeded)'));
        }
      },
      4 * 60 * 60 * 1000
    );

    // Clear timeout when process finishes
    whisperProcess.on('close', () => clearTimeout(timeout));
  });
});

// Cancel transcription
ipcMain.handle('transcribe:cancel', async () => {
  if (whisperProcess) {
    console.log('Cancelling transcription...');
    transcriptionCancelled = true;
    whisperProcess.kill('SIGTERM');
    // Force kill after 2 seconds if not terminated
    setTimeout(() => {
      if (whisperProcess) {
        console.log('Force killing whisper process after cancel...');
        whisperProcess.kill('SIGKILL');
        whisperProcess = null;
      }
    }, 2000);
    whisperProcess = null;
    return { success: true };
  }
  return { success: false, message: 'No transcription in progress' };
});

// Get memory usage
ipcMain.handle('app:getMemoryUsage', async () => {
  const processMemory = process.memoryUsage();
  return {
    heapUsed: Math.round(processMemory.heapUsed / (1024 * 1024)),
    heapTotal: Math.round(processMemory.heapTotal / (1024 * 1024)),
    rss: Math.round(processMemory.rss / (1024 * 1024)),
    external: Math.round(processMemory.external / (1024 * 1024)),
    isTranscribing: whisperProcess !== null,
  };
});

// Get app info
ipcMain.handle('app:getInfo', async () => {
  return {
    isDev,
    version: app.getVersion(),
    platform: process.platform,
  };
});

// Check whisper.cpp installation
ipcMain.handle('app:checkWhisper', async () => {
  try {
    const whisperPath = whisperCpp.getWhisperBinaryPath();
    const exists = fs.existsSync(whisperPath);
    const gpuStatus = whisperCpp.checkGpuStatus();

    return {
      available: exists,
      whisperPath,
      backend: 'whisper.cpp',
      gpu: gpuStatus,
    };
  } catch (err) {
    return {
      available: false,
      error: 'whisper.cpp not found. Please run: npm run setup:whisper',
    };
  }
});

// Auto-updater IPC handlers
// ipcMain.handle('updater:check', async () => {
//   if (isDev) {
//     return { error: 'Updates not available in development mode' };
//   }
//   try {
//     const result = await autoUpdater.checkForUpdates();
//     return { success: true };
//   } catch (err) {
//     return { error: err.message };
//   }
// });

ipcMain.handle('updater:download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall(false, true);
});
