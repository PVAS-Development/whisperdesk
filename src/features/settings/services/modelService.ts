import type { ModelInfo, GpuInfo, ModelDownloadProgress } from '../../../types';
import * as electronAPI from '../../../services/electronAPI';

export interface ModelState {
  models: ModelInfo[];
  gpuInfo: GpuInfo | null;
  loading: boolean;
  downloading: string | null;
}

export const initialModelState: ModelState = {
  models: [],
  gpuInfo: null,
  loading: true,
  downloading: null,
};

export const DEFAULT_MODELS: ModelInfo[] = [
  { name: 'tiny', size: '39 MB', speed: '~32x', quality: 1, downloaded: false },
  { name: 'base', size: '74 MB', speed: '~16x', quality: 2, downloaded: false },
  { name: 'small', size: '244 MB', speed: '~6x', quality: 3, downloaded: false },
  { name: 'medium', size: '769 MB', speed: '~2x', quality: 4, downloaded: false },
  { name: 'large', size: '1.5 GB', speed: '~1x', quality: 5, downloaded: false },
];

export async function listModels(): Promise<ModelInfo[]> {
  const result = await electronAPI.listModels();
  return result.models.length > 0 ? result.models : DEFAULT_MODELS;
}

export async function getGpuStatus(): Promise<GpuInfo> {
  return electronAPI.getGpuStatus();
}

export async function downloadModel(
  modelName: string
): Promise<{ success: boolean; model: string; path: string }> {
  return electronAPI.downloadModel(modelName);
}

export function onDownloadProgress(
  callback: (progress: ModelDownloadProgress) => void
): () => void {
  return electronAPI.onModelDownloadProgress(callback);
}

export function isModelDownloaded(models: ModelInfo[], modelName: string): boolean {
  const model = models.find((m) => m.name === modelName);
  return model?.downloaded ?? false;
}

export function getModelByName(models: ModelInfo[], modelName: string): ModelInfo | undefined {
  return models.find((m) => m.name === modelName);
}
