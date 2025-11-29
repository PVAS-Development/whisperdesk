const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn, execSync } = require('child_process')
const { autoUpdater } = require('electron-updater')

let mainWindow
let pythonProcess = null
let cachedPythonPath = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Configure auto-updater
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Auto-updater events
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('updater:checking')
  })

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('updater:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('updater:not-available')
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('updater:progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('updater:downloaded', {
      version: info.version
    })
  })

  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('updater:error', err.message)
  })
}

// Find Python executable
const findPython = () => {
  if (cachedPythonPath) return cachedPythonPath
  
  // In development, use the venv
  if (isDev) {
    const venvPython = path.join(__dirname, '../venv/bin/python3')
    if (fs.existsSync(venvPython)) {
      cachedPythonPath = venvPython
      return venvPython
    }
  }
  
  // List of possible Python paths to check
  const pythonCandidates = [
    // Check venv in resources (for potential future bundling)
    path.join(process.resourcesPath || '', 'python/venv/bin/python3'),
    // System Python paths
    '/usr/local/bin/python3',
    '/opt/homebrew/bin/python3',
    '/usr/bin/python3',
    'python3',
    'python'
  ]
  
  for (const pythonPath of pythonCandidates) {
    try {
      if (pythonPath.startsWith('/') && !fs.existsSync(pythonPath)) {
        continue
      }
      // Verify it's actually Python and has whisper
      const result = execSync(`"${pythonPath}" -c "import whisper; print('ok')"`, {
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      if (result.trim() === 'ok') {
        cachedPythonPath = pythonPath
        console.log(`Found Python with Whisper at: ${pythonPath}`)
        return pythonPath
      }
    } catch (e) {
      // Continue to next candidate
    }
  }
  
  // Last resort: just return python3 and let it fail with a clear message
  return 'python3'
}

// Get Python paths
const getPythonPath = () => findPython()

const getScriptPath = (script) => isDev
  ? path.join(__dirname, '../python', script)
  : path.join(process.resourcesPath, 'python', script)

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu:openFile')
          }
        },
        {
          label: 'Save Transcription...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu:saveFile')
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
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
            mainWindow.webContents.send('menu:copyTranscription')
          }
        }
      ]
    },
    {
      label: 'Transcription',
      submenu: [
        {
          label: 'Start Transcription',
          accelerator: 'CmdOrCtrl+Return',
          click: () => {
            mainWindow.webContents.send('menu:startTranscription')
          }
        },
        {
          label: 'Cancel Transcription',
          accelerator: 'Escape',
          click: () => {
            mainWindow.webContents.send('menu:cancelTranscription')
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle History',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.send('menu:toggleHistory')
          }
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
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
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
                message: 'Updates are not available in development mode'
              })
            } else {
              autoUpdater.checkForUpdates()
            }
          }
        },
        { type: 'separator' },
        {
          label: 'About WhisperDesk',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About WhisperDesk',
              message: 'WhisperDesk',
              detail: `Version: ${app.getVersion()}\nA desktop transcription app powered by OpenAI Whisper`
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Enable context menu for text selection (copy/paste)
  mainWindow.webContents.on('context-menu', (event, params) => {
    const { selectionText, isEditable } = params
    
    if (selectionText || isEditable) {
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Copy', role: 'copy', enabled: !!selectionText },
        { label: 'Select All', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Cut', role: 'cut', enabled: isEditable },
        { label: 'Paste', role: 'paste', enabled: isEditable },
      ])
      contextMenu.popup()
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createMenu()
  createWindow()
  setupAutoUpdater()

  // Check for updates on startup (only in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {})
    }, 3000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Clean up Python process
  if (pythonProcess) {
    console.log('Cleaning up Python process...')
    pythonProcess.kill('SIGTERM')
    // Force kill after 2 seconds if not terminated
    setTimeout(() => {
      if (pythonProcess) {
        console.log('Force killing Python process...')
        pythonProcess.kill('SIGKILL')
      }
    }, 2000)
    pythonProcess = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Clean up on app quit
app.on('before-quit', () => {
  if (pythonProcess) {
    console.log('App quitting, cleaning up Python process...')
    pythonProcess.kill('SIGTERM')
    pythonProcess = null
  }
})

// IPC Handlers

// Open file dialog
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Media Files', extensions: ['mp4', 'mp3', 'wav', 'm4a', 'webm', 'mov', 'avi', 'flac', 'ogg', 'mkv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  return result.canceled ? null : result.filePaths[0]
})

// Save file dialog and write content
ipcMain.handle('dialog:saveFile', async (event, { defaultName, content, format }) => {
  const filters = []
  
  switch (format) {
    case 'srt':
      filters.push({ name: 'SRT Subtitles', extensions: ['srt'] })
      break
    case 'vtt':
      filters.push({ name: 'VTT Subtitles', extensions: ['vtt'] })
      break
    case 'json':
      filters.push({ name: 'JSON', extensions: ['json'] })
      break
    default:
      filters.push({ name: 'Text Files', extensions: ['txt'] })
  }
  filters.push({ name: 'All Files', extensions: ['*'] })

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters
  })
  
  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true }
  }
  
  try {
    // Check disk space before writing (estimate: need at least 10MB free)
    const dir = path.dirname(result.filePath)
    if (!fs.existsSync(dir)) {
      throw new Error('Directory does not exist')
    }
    
    fs.writeFileSync(result.filePath, content, 'utf-8')
    return { success: true, filePath: result.filePath }
  } catch (err) {
    let errorMessage = err.message
    if (err.code === 'ENOSPC') {
      errorMessage = 'Insufficient disk space'
    } else if (err.code === 'EACCES' || err.code === 'EPERM') {
      errorMessage = 'Permission denied. Cannot write to this location.'
    }
    return { success: false, error: errorMessage }
  }
})

// Get file info
ipcMain.handle('file:getInfo', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath)
    return {
      size: stats.size,
      name: path.basename(filePath),
      path: filePath
    }
  } catch (err) {
    return null
  }
})

// Model Management

// Get list of all models with status
ipcMain.handle('models:list', async () => {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonPath()
    const scriptPath = getScriptPath('model_manager.py')
    
    const proc = spawn(pythonPath, [scriptPath, '--action', 'list'])
    let stdout = ''
    let stderr = ''
    
    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => { stderr += data.toString() })
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout))
        } catch (e) {
          reject(new Error('Failed to parse model list'))
        }
      } else {
        reject(new Error(stderr || 'Failed to get model list'))
      }
    })
  })
})

// Check GPU status
ipcMain.handle('models:gpuStatus', async () => {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonPath()
    const scriptPath = getScriptPath('model_manager.py')
    
    const proc = spawn(pythonPath, [scriptPath, '--action', 'gpu'])
    let stdout = ''
    
    proc.stdout.on('data', (data) => { stdout += data.toString() })
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout))
        } catch (e) {
          resolve({ available: false, type: 'cpu', name: 'Unknown' })
        }
      } else {
        resolve({ available: false, type: 'cpu', name: 'Unknown' })
      }
    })
  })
})

// Download a specific model
ipcMain.handle('models:download', async (event, modelName) => {
  return new Promise((resolve, reject) => {
    const pythonPath = getPythonPath()
    const scriptPath = getScriptPath('model_manager.py')
    
    const proc = spawn(pythonPath, [scriptPath, '--action', 'download', '--model', modelName])
    let stdout = ''
    let stderr = ''
    
    proc.stdout.on('data', (data) => { stdout += data.toString() })
    proc.stderr.on('data', (data) => {
      const message = data.toString()
      stderr += message
      // Send progress updates
      try {
        const lines = message.split('\n').filter(line => line.trim())
        for (const line of lines) {
          if (line.startsWith('{')) {
            const status = JSON.parse(line)
            mainWindow.webContents.send('models:downloadProgress', status)
          }
        }
      } catch (e) {}
    })
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout))
        } catch (e) {
          resolve({ success: true })
        }
      } else {
        reject(new Error(stderr || 'Failed to download model'))
      }
    })
  })
})

// Start transcription
ipcMain.handle('transcribe:start', async (event, options) => {
  const { filePath, model, language, outputFormat } = options
  
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found. Please select a valid file.')
  }
  
  const pythonPath = getPythonPath()
  const scriptPath = getScriptPath('transcribe.py')
  
  // Check if Python exists
  if (!fs.existsSync(pythonPath)) {
    throw new Error(`Python not found at ${pythonPath}. Please ensure Python environment is set up correctly.`)
  }
  
  // Check if script exists
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Transcription script not found at ${scriptPath}. Please reinstall the application.`)
  }

  // Build PATH with common FFmpeg locations
  const ffmpegPaths = [
    '/opt/homebrew/bin',  // Apple Silicon Homebrew
    '/usr/local/bin',     // Intel Homebrew
    '/opt/local/bin',     // MacPorts
    '/usr/bin',
    '/bin'
  ]
  const enhancedPath = [...ffmpegPaths, process.env.PATH].filter(Boolean).join(':')

  return new Promise((resolve, reject) => {
    const args = [
      scriptPath,
      '--input', filePath,
      '--model', model || 'base',
      '--format', outputFormat || 'txt'
    ]
    
    if (language && language !== 'auto') {
      args.push('--language', language)
    }

    try {
      pythonProcess = spawn(pythonPath, args, {
        env: { ...process.env, PATH: enhancedPath }
      })
    } catch (err) {
      reject(new Error(`Failed to start Python process: ${err.message}`))
      return
    }
    
    let stdout = ''
    let stderr = ''
    let lastProgress = null

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString()
      stderr += message
      
      // Try to parse progress updates
      try {
        const lines = message.split('\n').filter(line => line.trim())
        for (const line of lines) {
          if (line.startsWith('{')) {
            const progress = JSON.parse(line)
            lastProgress = progress
            mainWindow.webContents.send('transcribe:progress', progress)
          }
        }
      } catch (e) {
        // Not JSON, just log output
        console.log('Whisper:', message)
      }
    })

    pythonProcess.on('close', (code) => {
      pythonProcess = null
      
      if (code === 0) {
        if (!stdout.trim()) {
          reject(new Error('Transcription produced no output'))
        } else {
          resolve({ success: true, text: stdout.trim() })
        }
      } else if (code === 130) {
        // User cancelled (SIGINT)
        reject(new Error('Transcription cancelled'))
      } else {
        // Extract error message from last progress or stderr
        let errorMsg = 'Transcription failed'
        if (lastProgress && lastProgress.status && lastProgress.status.includes('Error')) {
          errorMsg = lastProgress.status
        } else if (stderr.trim()) {
          // Get last meaningful line from stderr
          const lines = stderr.trim().split('\n').filter(l => l.trim())
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1]
            if (lastLine.startsWith('{')) {
              try {
                const err = JSON.parse(lastLine)
                errorMsg = err.status || errorMsg
              } catch (e) {
                errorMsg = lastLine
              }
            } else {
              errorMsg = lastLine
            }
          }
        }
        reject(new Error(errorMsg))
      }
    })

    pythonProcess.on('error', (err) => {
      pythonProcess = null
      let errorMsg = 'Failed to start transcription process'
      if (err.code === 'ENOENT') {
        errorMsg = 'Python not found. Please ensure Python is installed.'
      } else if (err.code === 'EACCES') {
        errorMsg = 'Permission denied. Cannot execute Python.'
      } else {
        errorMsg = `Process error: ${err.message}`
      }
      reject(new Error(errorMsg))
    })
    
    // Set timeout for very long transcriptions (4 hours)
    const timeout = setTimeout(() => {
      if (pythonProcess) {
        pythonProcess.kill('SIGTERM')
        pythonProcess = null
        reject(new Error('Transcription timeout (4 hours exceeded)'))
      }
    }, 4 * 60 * 60 * 1000)
    
    // Clear timeout when process finishes
    pythonProcess.on('close', () => clearTimeout(timeout))
  })
})

// Cancel transcription
ipcMain.handle('transcribe:cancel', async () => {
  if (pythonProcess) {
    console.log('Cancelling transcription...')
    pythonProcess.kill('SIGTERM')
    // Force kill after 2 seconds if not terminated
    setTimeout(() => {
      if (pythonProcess) {
        console.log('Force killing Python process after cancel...')
        pythonProcess.kill('SIGKILL')
        pythonProcess = null
      }
    }, 2000)
    pythonProcess = null
    return { success: true }
  }
  return { success: false, message: 'No transcription in progress' }
})

// Get memory usage
ipcMain.handle('app:getMemoryUsage', async () => {
  const processMemory = process.memoryUsage()
  return {
    heapUsed: Math.round(processMemory.heapUsed / (1024 * 1024)),
    heapTotal: Math.round(processMemory.heapTotal / (1024 * 1024)),
    rss: Math.round(processMemory.rss / (1024 * 1024)),
    external: Math.round(processMemory.external / (1024 * 1024)),
    isTranscribing: pythonProcess !== null
  }
})

// Get app info
ipcMain.handle('app:getInfo', async () => {
  return {
    isDev,
    version: app.getVersion(),
    platform: process.platform,
  }
})

// Check Python and Whisper installation
ipcMain.handle('app:checkPython', async () => {
  try {
    const pythonPath = getPythonPath()
    
    // Check if Python exists and Whisper is installed
    const result = execSync(`"${pythonPath}" -c "import whisper; import torch; print(whisper.__version__)"`, {
      encoding: 'utf-8',
      timeout: 15000
    })
    
    return {
      available: true,
      pythonPath,
      whisperVersion: result.trim()
    }
  } catch (err) {
    return {
      available: false,
      error: 'Python or Whisper not found. Please install Python 3.9+ and run: pip install openai-whisper'
    }
  }
})

// Auto-updater IPC handlers
ipcMain.handle('updater:check', async () => {
  if (isDev) {
    return { error: 'Updates not available in development mode' }
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('updater:download', async () => {
  try {
    await autoUpdater.downloadUpdate()
    return { success: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall(false, true)
})
