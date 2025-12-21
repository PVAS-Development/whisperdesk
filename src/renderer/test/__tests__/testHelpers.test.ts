import { describe, it, expect, beforeEach } from 'vitest';
import {
  useLocalStorageCleanup,
  useThemeCleanup,
  useStorageAndThemeCleanup,
  setupWindowMocks,
  createHistoryItems,
  parseStorageItem,
  itemExistsInStorage,
  getStorageString,
  getFromStorage,
} from '../testHelpers';

describe('testHelpers', () => {
  describe('useLocalStorageCleanup', () => {
    useLocalStorageCleanup();

    it('clears localStorage before and after tests', () => {
      localStorage.setItem('test', 'value');
      expect(localStorage.getItem('test')).toBe('value');
    });
  });

  describe('useThemeCleanup', () => {
    useThemeCleanup();

    it('removes data-theme attribute before and after tests', () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('useStorageAndThemeCleanup', () => {
    useStorageAndThemeCleanup();

    it('clears both storage and theme', () => {
      localStorage.setItem('test', 'value');
      document.documentElement.setAttribute('data-theme', 'dark');
      expect(localStorage.getItem('test')).toBe('value');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('setupWindowMocks', () => {
    it('creates window confirm and alert mocks', () => {
      const { confirm, alert } = setupWindowMocks(true);
      expect(confirm).toBeDefined();
      expect(alert).toBeDefined();
    });

    it('window confirm returns specified value', () => {
      const { confirm } = setupWindowMocks(false);
      window.confirm('test');
      expect(confirm).toHaveBeenCalled();
    });
  });

  describe('createHistoryItems', () => {
    it('creates array of history items with correct count', () => {
      const items = createHistoryItems(3);
      expect(items).toHaveLength(3);
    });

    it('creates items with correct id and fileName', () => {
      const items = createHistoryItems(2);
      expect(typeof items[0]?.id).toBe('string');
      expect(items[0]?.fileName).toBe('file0.mp3');
      expect(typeof items[1]?.id).toBe('string');
      expect(items[1]?.fileName).toBe('file1.mp3');
    });

    it('merges base item properties', () => {
      const items = createHistoryItems(1);
      expect(items[0]?.model).toBe('base');
      expect(items[0]?.language).toBe('en');
    });
  });

  describe('parseStorageItem', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns parsed JSON from storage', () => {
      localStorage.setItem('test', JSON.stringify({ key: 'value' }));
      const result = parseStorageItem('test', {});
      expect(result).toEqual({ key: 'value' });
    });

    it('returns default value when item not found', () => {
      const result = parseStorageItem('missing', { default: true });
      expect(result).toEqual({ default: true });
    });

    it('returns default value when JSON is invalid', () => {
      localStorage.setItem('invalid', 'not json');
      const result = parseStorageItem('invalid', { default: true });
      expect(result).toEqual({ default: true });
    });
  });

  describe('itemExistsInStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns true when item exists', () => {
      localStorage.setItem('exists', 'value');
      expect(itemExistsInStorage('exists')).toBe(true);
    });

    it('returns false when item does not exist', () => {
      expect(itemExistsInStorage('missing')).toBe(false);
    });
  });

  describe('getStorageString', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns stored string value', () => {
      localStorage.setItem('str', 'test value');
      expect(getStorageString('str')).toBe('test value');
    });

    it('returns default value when not found', () => {
      expect(getStorageString('missing', 'default')).toBe('default');
    });

    it('returns empty string as default when not specified', () => {
      expect(getStorageString('missing')).toBe('');
    });
  });

  describe('getFromStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('returns parsed JSON from storage', () => {
      localStorage.setItem('data', JSON.stringify({ test: 'value' }));
      expect(getFromStorage('data')).toEqual({ test: 'value' });
    });

    it('returns null when item not found', () => {
      expect(getFromStorage('missing')).toBeNull();
    });

    it('returns null when JSON is invalid', () => {
      localStorage.setItem('bad', 'invalid json');
      expect(getFromStorage('bad')).toBeNull();
    });
  });
});
