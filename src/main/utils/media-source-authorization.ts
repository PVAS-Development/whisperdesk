import fs from 'fs';
import path from 'path';
import { SUPPORTED_EXTENSIONS } from '../../shared/types';
import type { SupportedExtension } from '../../shared/types';

export type MediaPathValidationResult =
  | {
      success: true;
      filePath: string;
      extension: SupportedExtension;
    }
  | {
      success: false;
      error: string;
    };

const approvedMediaFilePaths = new Set<string>();

function getSupportedMediaExtension(filePath: string): SupportedExtension | null {
  const extension = path.extname(filePath).replace('.', '').toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(extension as SupportedExtension)
    ? (extension as SupportedExtension)
    : null;
}

export async function validateMediaFilePath(filePath: string): Promise<MediaPathValidationResult> {
  if (typeof filePath !== 'string' || filePath.trim().length === 0) {
    return { success: false, error: 'Invalid file path' };
  }

  if (!path.isAbsolute(filePath)) {
    return { success: false, error: 'Invalid file path' };
  }

  const normalizedPath = path.resolve(filePath);
  let resolvedPath: string;

  try {
    const linkStats = await fs.promises.lstat(normalizedPath);
    if (linkStats.isSymbolicLink() || !linkStats.isFile()) {
      return { success: false, error: 'Unsupported media file' };
    }

    resolvedPath = await fs.promises.realpath(normalizedPath);
    const stats = await fs.promises.stat(resolvedPath);
    if (!stats.isFile()) {
      return { success: false, error: 'Unsupported media file' };
    }
  } catch {
    return { success: false, error: 'File not found' };
  }

  const extension = getSupportedMediaExtension(resolvedPath);
  if (!extension) {
    return { success: false, error: 'Unsupported media file' };
  }

  try {
    await fs.promises.access(resolvedPath, fs.constants.R_OK);
  } catch {
    return { success: false, error: 'File not found' };
  }

  return {
    success: true,
    filePath: resolvedPath,
    extension,
  };
}

export async function approveMediaFilePath(filePath: string): Promise<void> {
  const validation = await validateMediaFilePath(filePath);
  if (validation.success) {
    approvedMediaFilePaths.add(validation.filePath);
  }
}

export async function approveMediaFilePaths(filePaths: readonly string[]): Promise<void> {
  await Promise.all(filePaths.map((filePath) => approveMediaFilePath(filePath)));
}

export async function resolveApprovedMediaFilePath(
  filePath: string
): Promise<MediaPathValidationResult> {
  const validation = await validateMediaFilePath(filePath);
  if (!validation.success) {
    return validation;
  }

  if (!approvedMediaFilePaths.has(validation.filePath)) {
    return { success: false, error: 'Media file is not approved for preview' };
  }

  return validation;
}
