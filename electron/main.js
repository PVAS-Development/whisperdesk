const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let pythonProcess = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

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

// Save file dialog
ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'SRT Subtitles', extensions: ['srt'] },
      { name: 'VTT Subtitles', extensions: ['vtt'] },
      { name: 'JSON', extensions: ['json'] }
    ]
  })
  return result.canceled ? null : result.filePath
})

// Start transcription
ipcMain.handle('transcribe:start', async (event, options) => {
  const { filePath, model, language, outputFormat } = options
  
  // Get the Python path from venv
  const pythonPath = isDev 
    ? path.join(__dirname, '../venv/bin/python3')
    : path.join(process.resourcesPath, 'python/bin/python3')
  
  const scriptPath = isDev
    ? path.join(__dirname, '../python/transcribe.py')
    : path.join(process.resourcesPath, 'python/transcribe.py')

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
