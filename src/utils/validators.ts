import { SUPPORTED_EXTENSIONS } from '../config';

export function isValidMediaFile(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function getFileNameWithoutExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
