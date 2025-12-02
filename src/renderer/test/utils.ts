import type { ElectronAPI } from '../types/electron';

export function overrideElectronAPI(overrides: Partial<ElectronAPI>): void {
  if (!window.electronAPI) return;

  Object.assign(window.electronAPI, overrides);
}
