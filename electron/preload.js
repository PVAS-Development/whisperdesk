const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (defaultName) => ipcRenderer.invoke('dialog:saveFile', defaultName),
  
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
