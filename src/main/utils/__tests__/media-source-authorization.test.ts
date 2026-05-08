import type * as fs from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { accessMock, lstatMock, realpathMock, statMock } = vi.hoisted(() => ({
  accessMock: vi.fn(),
  lstatMock: vi.fn(),
  realpathMock: vi.fn(),
  statMock: vi.fn(),
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs');
  const constants = {
    R_OK: 4,
  };

  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual,
      constants,
      promises: {
        ...actual.promises,
        access: accessMock,
        lstat: lstatMock,
        realpath: realpathMock,
        stat: statMock,
      },
    },
    constants,
    promises: {
      ...actual.promises,
      access: accessMock,
      lstat: lstatMock,
      realpath: realpathMock,
      stat: statMock,
    },
  };
});

async function loadAuthorizationModule() {
  vi.resetModules();
  accessMock.mockReset();
  lstatMock.mockReset();
  realpathMock.mockReset();
  statMock.mockReset();

  return import('../media-source-authorization');
}

function useReadableMediaFile(realPath = '/tmp/audio.mp3'): void {
  accessMock.mockResolvedValue(undefined);
  lstatMock.mockResolvedValue({
    isFile: () => true,
    isSymbolicLink: () => false,
  });
  realpathMock.mockResolvedValue(realPath);
  statMock.mockResolvedValue({ isFile: () => true });
}

describe('media-source-authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates readable, regular media files by canonical path', async () => {
    const { validateMediaFilePath } = await loadAuthorizationModule();
    useReadableMediaFile('/private/tmp/movie.mp4');

    await expect(validateMediaFilePath('/tmp/movie.mp4')).resolves.toEqual({
      success: true,
      filePath: '/private/tmp/movie.mp4',
      extension: 'mp4',
    });
    expect(accessMock).toHaveBeenCalledWith('/private/tmp/movie.mp4', 4);
  });

  it.each(['', 'audio.mp3'])('rejects invalid path %j', async (filePath) => {
    const { validateMediaFilePath } = await loadAuthorizationModule();

    await expect(validateMediaFilePath(filePath)).resolves.toEqual({
      success: false,
      error: 'Invalid file path',
    });
    expect(lstatMock).not.toHaveBeenCalled();
  });

  it('rejects symlinks before resolving the real path', async () => {
    const { validateMediaFilePath } = await loadAuthorizationModule();
    lstatMock.mockResolvedValue({
      isFile: () => false,
      isSymbolicLink: () => true,
    });

    await expect(validateMediaFilePath('/tmp/link.mp3')).resolves.toEqual({
      success: false,
      error: 'Unsupported media file',
    });
    expect(realpathMock).not.toHaveBeenCalled();
  });

  it('rejects unsupported extensions and unreadable files', async () => {
    const { validateMediaFilePath } = await loadAuthorizationModule();
    useReadableMediaFile('/tmp/notes.txt');

    await expect(validateMediaFilePath('/tmp/notes.txt')).resolves.toEqual({
      success: false,
      error: 'Unsupported media file',
    });

    useReadableMediaFile('/tmp/audio.mp3');
    accessMock.mockRejectedValue(new Error('denied'));

    await expect(validateMediaFilePath('/tmp/audio.mp3')).resolves.toEqual({
      success: false,
      error: 'File not found',
    });
  });

  it('requires main-process approval before resolving media preview paths', async () => {
    const { approveMediaFilePaths, resolveApprovedMediaFilePath } = await loadAuthorizationModule();
    useReadableMediaFile('/tmp/audio.mp3');

    await expect(resolveApprovedMediaFilePath('/tmp/audio.mp3')).resolves.toEqual({
      success: false,
      error: 'Media file is not approved for preview',
    });

    await approveMediaFilePaths(['/tmp/audio.mp3']);

    await expect(resolveApprovedMediaFilePath('/tmp/audio.mp3')).resolves.toEqual({
      success: true,
      filePath: '/tmp/audio.mp3',
      extension: 'mp3',
    });
  });
});
