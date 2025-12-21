import { openMultipleFilesDialog, getFileInfo } from '../services/electronAPI';
import { isValidMediaFile } from './validators';
import type { SelectedFile } from '../types';

export async function selectAndProcessFiles(): Promise<SelectedFile[]> {
  const filePaths = await openMultipleFilesDialog();
  if (!filePaths || filePaths.length === 0) return [];

  const filesWithInfo: SelectedFile[] = [];
  for (const filePath of filePaths) {
    const fileInfo = await getFileInfo(filePath);
    if (fileInfo && isValidMediaFile(fileInfo.name)) {
      filesWithInfo.push(fileInfo);
    }
  }
  return filesWithInfo;
}
