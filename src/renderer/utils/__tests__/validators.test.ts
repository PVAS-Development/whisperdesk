import { describe, it, expect } from 'vitest';
import {
  isValidMediaFile,
  getFileExtension,
  getFileNameWithoutExtension,
  escapeRegex,
} from '../validators';

describe('validators', () => {
  describe('isValidMediaFile', () => {
    it('should return true for valid audio extensions', () => {
      expect(isValidMediaFile('audio.mp3')).toBe(true);
      expect(isValidMediaFile('track.wav')).toBe(true);
      expect(isValidMediaFile('song.m4a')).toBe(true);
      expect(isValidMediaFile('music.flac')).toBe(true);
      expect(isValidMediaFile('audio.ogg')).toBe(true);
    });

    it('should return true for valid video extensions', () => {
      expect(isValidMediaFile('video.mp4')).toBe(true);
      expect(isValidMediaFile('movie.mov')).toBe(true);
      expect(isValidMediaFile('clip.avi')).toBe(true);
      expect(isValidMediaFile('film.mkv')).toBe(true);
      expect(isValidMediaFile('animation.webm')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isValidMediaFile('audio.MP3')).toBe(true);
      expect(isValidMediaFile('Video.MP4')).toBe(true);
      expect(isValidMediaFile('Song.WaV')).toBe(true);
    });

    it('should return false for invalid extensions', () => {
      expect(isValidMediaFile('document.txt')).toBe(false);
      expect(isValidMediaFile('image.png')).toBe(false);
      expect(isValidMediaFile('spreadsheet.xlsx')).toBe(false);
    });

    it('should return false for files without extension', () => {
      expect(isValidMediaFile('audiofile')).toBe(false);
      expect(isValidMediaFile('')).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('document.txt')).toBe('txt');
      expect(getFileExtension('audio.mp3')).toBe('mp3');
      expect(getFileExtension('video.MP4')).toBe('mp4');
    });

    it('should handle multiple dots in filename', () => {
      expect(getFileExtension('my.file.name.mp3')).toBe('mp3');
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
    });

    it('should treat filenames without dot as extension', () => {
      expect(getFileExtension('audiofile')).toBe('audiofile');
    });

    it('should return empty string for empty filename', () => {
      expect(getFileExtension('')).toBe('');
    });

    it('should handle filenames starting with dot', () => {
      expect(getFileExtension('.bashrc')).toBe('bashrc');
    });

    it('should be case-insensitive', () => {
      expect(getFileExtension('AUDIO.MP3')).toBe('mp3');
    });
  });

  describe('getFileNameWithoutExtension', () => {
    it('should remove file extension', () => {
      expect(getFileNameWithoutExtension('document.txt')).toBe('document');
      expect(getFileNameWithoutExtension('audio.mp3')).toBe('audio');
      expect(getFileNameWithoutExtension('video.mp4')).toBe('video');
    });

    it('should handle multiple dots in filename', () => {
      expect(getFileNameWithoutExtension('my.file.name.mp3')).toBe('my.file.name');
      expect(getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
    });

    it('should return original string if no extension', () => {
      expect(getFileNameWithoutExtension('audiofile')).toBe('audiofile');
      expect(getFileNameWithoutExtension('')).toBe('');
    });
  });

  describe('escapeRegex', () => {
    it('should escape regex special characters', () => {
      expect(escapeRegex('hello.world')).toBe('hello\\.world');
      expect(escapeRegex('a+b')).toBe('a\\+b');
      expect(escapeRegex('test?')).toBe('test\\?');
    });

    it('should escape all special characters', () => {
      const input = '.*+?^${}()|[]\\';
      const output = escapeRegex(input);

      expect(output).toContain('\\.');
      expect(output).toContain('\\*');
      expect(output).toContain('\\+');
      expect(output).toContain('\\?');
    });

    it('should return normal strings unchanged (except escaping)', () => {
      expect(escapeRegex('hello')).toBe('hello');
      expect(escapeRegex('world123')).toBe('world123');
    });

    it('should be safe to use in regex constructors', () => {
      const userInput = 'test[123]';
      const escaped = escapeRegex(userInput);
      const regex = new RegExp(escaped);

      expect(regex.test('test[123]')).toBe(true);
      expect(regex.test('test123')).toBe(false);
    });
  });
});
