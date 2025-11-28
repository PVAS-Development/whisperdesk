const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn, execSync } = require('child_process')

let mainWindow
let pythonProcess = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

// Get Python paths
const getPythonPath = () => isDev 
  ? path.join(__dirname, '../venv/bin/python3')
  : path.join(process.resourcesPath, 'python/bin/python3')

const getScriptPath = (script) => isDev
  ? path.join(__dirname, '../python', script)
  : path.join(process.resourcesPath, 'python', script)

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

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill()
  }
  if (process.platform !== 'darwin') {
    app.quit()
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
    fs.writeFileSync(result.filePath, content, 'utf-8')
    return { success: true, filePath: result.filePath }
  } catch (err) {
    return { success: false, error: err.message }
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
  
  const pythonPath = getPythonPath()
  const scriptPath = getScriptPath('transcribe.py')

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

    pythonProcess = spawn(pythonPath, args)
    
    let stdout = ''
    let stderr = ''

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
        resolve({ success: true, text: stdout.trim() })
      } else {
        reject(new Error(stderr || `Process exited with code ${code}`))
      }
    })

    pythonProcess.on('error', (err) => {
      pythonProcess = null
      reject(err)
    })
  })
})

// Cancel transcription
ipcMain.handle('transcribe:cancel', async () => {
  if (pythonProcess) {
    pythonProcess.kill('SIGTERM')
    pythonProcess = null
    return { success: true }
  }
  return { success: false, message: 'No transcription in progress' }
})

// Get app info
ipcMain.handle('app:getInfo', async () => {
  return {
    isDev,
    version: app.getVersion(),
    platform: process.platform,
  }
})
