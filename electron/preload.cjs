const { contextBridge, ipcRenderer } = require('electron');

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
    ipcRenderer.on('models:downloadProgress', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('models:downloadProgress');
  },

  // Transcription operations
  startTranscription: (options) => ipcRenderer.invoke('transcribe:start', options),
  cancelTranscription: () => ipcRenderer.invoke('transcribe:cancel'),
  onTranscriptionProgress: (callback) => {
    ipcRenderer.on('transcribe:progress', (event, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('transcribe:progress');
  },

  // App info
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  getMemoryUsage: () => ipcRenderer.invoke('app:getMemoryUsage'),

  // Auto-updater
  // checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  // downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  // installUpdate: () => ipcRenderer.invoke('updater:install'),
  // onUpdateChecking: (callback) => {
  //   ipcRenderer.on('updater:checking', callback)
  //   return () => ipcRenderer.removeListener('updater:checking', callback)
  // },
  // onUpdateAvailable: (callback) => {
  //   ipcRenderer.on('updater:available', (event, data) => callback(data))
  //   return () => ipcRenderer.removeListener('updater:available', callback)
  // },
  // onUpdateNotAvailable: (callback) => {
  //   ipcRenderer.on('updater:not-available', callback)
  //   return () => ipcRenderer.removeListener('updater:not-available', callback)
  // },
  // onUpdateProgress: (callback) => {
  //   ipcRenderer.on('updater:progress', (event, data) => callback(data))
  //   return () => ipcRenderer.removeListener('updater:progress', callback)
  // },
  // onUpdateDownloaded: (callback) => {
  //   ipcRenderer.on('updater:downloaded', (event, data) => callback(data))
  //   return () => ipcRenderer.removeListener('updater:downloaded', callback)
  // },
  // onUpdateError: (callback) => {
  //   ipcRenderer.on('updater:error', (event, message) => callback(message))
  //   return () => ipcRenderer.removeListener('updater:error', callback)
  // },

  // Menu event listeners
  onMenuOpenFile: (callback) => {
    ipcRenderer.on('menu:openFile', callback);
    return () => ipcRenderer.removeListener('menu:openFile', callback);
  },
  onMenuSaveFile: (callback) => {
    ipcRenderer.on('menu:saveFile', callback);
    return () => ipcRenderer.removeListener('menu:saveFile', callback);
  },
  onMenuCopyTranscription: (callback) => {
    ipcRenderer.on('menu:copyTranscription', callback);
    return () => ipcRenderer.removeListener('menu:copyTranscription', callback);
  },
  onMenuStartTranscription: (callback) => {
    ipcRenderer.on('menu:startTranscription', callback);
    return () => ipcRenderer.removeListener('menu:startTranscription', callback);
  },
  onMenuCancelTranscription: (callback) => {
    ipcRenderer.on('menu:cancelTranscription', callback);
    return () => ipcRenderer.removeListener('menu:cancelTranscription', callback);
  },
  onMenuToggleHistory: (callback) => {
    ipcRenderer.on('menu:toggleHistory', callback);
    return () => ipcRenderer.removeListener('menu:toggleHistory', callback);
  },
});
