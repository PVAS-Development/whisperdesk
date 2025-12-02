import { describe, it, expect } from 'vitest';
import { formatTime, formatDuration, formatDate, formatFileSize } from '../formatters';

describe('formatters', () => {
  describe('formatTime', () => {
    it('should format seconds as "s" when less than 60', () => {
      expect(formatTime(0)).toBe('0s');
      expect(formatTime(30)).toBe('30s');
      expect(formatTime(59)).toBe('59s');
    });

    it('should format minutes and seconds when 60-3599 seconds', () => {
      expect(formatTime(60)).toBe('1m');
      expect(formatTime(90)).toBe('1m 30s');
      expect(formatTime(150)).toBe('2m 30s');
      expect(formatTime(3599)).toBe('59m 59s');
    });

    it('should format hours and minutes when 3600+ seconds', () => {
      expect(formatTime(3600)).toBe('1h 0m');
      expect(formatTime(3660)).toBe('1h 1m');
      expect(formatTime(7200)).toBe('2h 0m');
      expect(formatTime(7260)).toBe('2h 1m');
    });

    it('should handle decimal seconds', () => {
      expect(formatTime(30.5)).toBe('31s');
      expect(formatTime(90.7)).toBe('1m 31s');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds when less than 60', () => {
      expect(formatDuration(0)).toBe('0s');
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(59)).toBe('59s');
    });

    it('should format minutes and seconds when 60+ seconds', () => {
      expect(formatDuration(60)).toBe('1m 0s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(150)).toBe('2m 30s');
    });
  });

  describe('formatDate', () => {
    it('should format date and time', () => {
      const dateString = '2025-12-01T14:30:00Z';
      const formatted = formatDate(dateString);

      expect(formatted).toContain('/');
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle different date formats', () => {
      const dateString = '2024-01-15T09:00:00Z';
      const formatted = formatDate(dateString);

      expect(formatted.length).toBeGreaterThan(0);
      expect(typeof formatted).toBe('string');
    });
  });

  describe('formatFileSize', () => {
    it('should return empty string for undefined', () => {
      expect(formatFileSize(undefined)).toBe('');
    });

    it('should format bytes as KB when less than 1 MB', () => {
      expect(formatFileSize(512)).toBe('0.5 KB');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(512000)).toBe('500.0 KB');
    });

    it('should format bytes as MB when 1 MB or greater', () => {
      expect(formatFileSize(1048577)).toBe('1.0 MB');
      expect(formatFileSize(10485760)).toBe('10.0 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
    });
  });
});
