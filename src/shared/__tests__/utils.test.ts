import { describe, it, expect } from 'vitest';
import { sanitizePath } from '../utils';

describe('sanitizePath', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizePath('')).toBe('');
    expect(sanitizePath(null)).toBe('');
    expect(sanitizePath(undefined)).toBe('');
  });

  it('should extract filename from path', () => {
    expect(sanitizePath('/path/to/file.mp3')).toBe('file.mp3');
    expect(sanitizePath('C:\\path\\to\\file.mp3')).toBe('file.mp3');
  });

  it('should return filename if no path separators', () => {
    expect(sanitizePath('file.mp3')).toBe('file.mp3');
  });
});
