import { contextBridge, ipcRenderer } from 'electron';

export interface OverlayState {
  status: 'recording' | 'processing' | 'success' | 'error' | 'idle';
  message?: string;
}

contextBridge.exposeInMainWorld('overlayAPI', {
  onStateUpdate: (callback: (state: OverlayState) => void) => {
    ipcRenderer.on('overlay:update', (_event, state: OverlayState) => callback(state));
  },
});
