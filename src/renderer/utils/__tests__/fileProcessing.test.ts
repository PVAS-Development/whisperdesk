import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { selectAndProcessFiles } from '../fileProcessing';
import * as electronAPI from '../../services/electronAPI';
import * as validators from '../validators';

vi.mock('../../services/electronAPI', () => ({
  openMultipleFilesDialog: vi.fn(),
  getFileInfo: vi.fn(),
}));

vi.mock('../validators', () => ({
  isValidMediaFile: vi.fn(),
}));

describe('fileProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('selectAndProcessFiles', () => {
    it('returns empty array when dialog is cancelled', async () => {
      (electronAPI.openMultipleFilesDialog as Mock).mockResolvedValue(null);

      const result = await selectAndProcessFiles();

      expect(result).toEqual([]);
      expect(electronAPI.getFileInfo).not.toHaveBeenCalled();
    });

    it('returns empty array when no files selected', async () => {
      (electronAPI.openMultipleFilesDialog as Mock).mockResolvedValue([]);

      const result = await selectAndProcessFiles();

      expect(result).toEqual([]);
      expect(electronAPI.getFileInfo).not.toHaveBeenCalled();
    });

    it('processes valid media files and returns file info', async () => {
      const filePaths = ['/path/to/audio.mp3', '/path/to/video.mp4'];
      const fileInfo1 = { name: 'audio.mp3', path: '/path/to/audio.mp3', size: 1000 };
      const fileInfo2 = { name: 'video.mp4', path: '/path/to/video.mp4', size: 2000 };

      (electronAPI.openMultipleFilesDialog as Mock).mockResolvedValue(filePaths);
      (electronAPI.getFileInfo as Mock)
        .mockResolvedValueOnce(fileInfo1)
        .mockResolvedValueOnce(fileInfo2);
      (validators.isValidMediaFile as Mock).mockReturnValue(true);

      const result = await selectAndProcessFiles();

      expect(result).toEqual([fileInfo1, fileInfo2]);
      expect(electronAPI.getFileInfo).toHaveBeenCalledTimes(2);
      expect(electronAPI.getFileInfo).toHaveBeenCalledWith('/path/to/audio.mp3');
      expect(electronAPI.getFileInfo).toHaveBeenCalledWith('/path/to/video.mp4');
      expect(validators.isValidMediaFile).toHaveBeenCalledWith('audio.mp3');
      expect(validators.isValidMediaFile).toHaveBeenCalledWith('video.mp4');
    });

    it('filters out invalid media files', async () => {
      const filePaths = ['/path/to/audio.mp3', '/path/to/document.pdf'];
      const fileInfo1 = { name: 'audio.mp3', path: '/path/to/audio.mp3', size: 1000 };
      const fileInfo2 = { name: 'document.pdf', path: '/path/to/document.pdf', size: 500 };

      (electronAPI.openMultipleFilesDialog as Mock).mockResolvedValue(filePaths);
      (electronAPI.getFileInfo as Mock)
        .mockResolvedValueOnce(fileInfo1)
        .mockResolvedValueOnce(fileInfo2);
      (validators.isValidMediaFile as Mock).mockReturnValueOnce(true).mockReturnValueOnce(false);

      const result = await selectAndProcessFiles();

      expect(result).toEqual([fileInfo1]);
      expect(validators.isValidMediaFile).toHaveBeenCalledWith('audio.mp3');
      expect(validators.isValidMediaFile).toHaveBeenCalledWith('document.pdf');
    });

    it('skips files when getFileInfo returns null', async () => {
      const filePaths = ['/path/to/audio.mp3', '/path/to/missing.mp3'];
      const fileInfo1 = { name: 'audio.mp3', path: '/path/to/audio.mp3', size: 1000 };

      (electronAPI.openMultipleFilesDialog as Mock).mockResolvedValue(filePaths);
      (electronAPI.getFileInfo as Mock)
        .mockResolvedValueOnce(fileInfo1)
        .mockResolvedValueOnce(null);
      (validators.isValidMediaFile as Mock).mockReturnValue(true);

      const result = await selectAndProcessFiles();

      expect(result).toEqual([fileInfo1]);
      expect(electronAPI.getFileInfo).toHaveBeenCalledTimes(2);
    });

    it('handles single file selection', async () => {
      const filePaths = ['/path/to/audio.mp3'];
      const fileInfo = { name: 'audio.mp3', path: '/path/to/audio.mp3', size: 1000 };

      (electronAPI.openMultipleFilesDialog as Mock).mockResolvedValue(filePaths);
      (electronAPI.getFileInfo as Mock).mockResolvedValue(fileInfo);
      (validators.isValidMediaFile as Mock).mockReturnValue(true);

      const result = await selectAndProcessFiles();

      expect(result).toEqual([fileInfo]);
    });

    it('returns empty array when all files are invalid', async () => {
      const filePaths = ['/path/to/doc.pdf', '/path/to/text.txt'];
      const fileInfo1 = { name: 'doc.pdf', path: '/path/to/doc.pdf', size: 500 };
      const fileInfo2 = { name: 'text.txt', path: '/path/to/text.txt', size: 100 };

      (electronAPI.openMultipleFilesDialog as Mock).mockResolvedValue(filePaths);
      (electronAPI.getFileInfo as Mock)
        .mockResolvedValueOnce(fileInfo1)
        .mockResolvedValueOnce(fileInfo2);
      (validators.isValidMediaFile as Mock).mockReturnValue(false);

      const result = await selectAndProcessFiles();

      expect(result).toEqual([]);
    });
  });
});
