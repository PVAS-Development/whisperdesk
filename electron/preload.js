const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  
  // File operations
  getFileInfo: (filePath) => ipcRenderer.invoke('file:getInfo', filePath),
  
  // Model management
  listModels: () => ipcRenderer.invoke('models:list'),
  getGpuStatus: () => ipcRenderer.invoke('models:gpuStatus'),
  downloadModel: (modelName) => ipcRenderer.invoke('models:download', modelName),
  onModelDownloadProgress: (callback) => {
    ipcRenderer.on('models:downloadProgress', (event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('models:downloadProgress')
  },
  
  // Transcription operations
  startTranscription: (options) => ipcRenderer.invoke('transcribe:start', options),
  cancelTranscription: () => ipcRenderer.invoke('transcribe:cancel'),
  onTranscriptionProgress: (callback) => {
    ipcRenderer.on('transcribe:progress', (event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('transcribe:progress')
  },
  
  // App info
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
})
