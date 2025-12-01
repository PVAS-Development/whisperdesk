import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { useStorageAndThemeCleanup } from '@/test/testHelpers';

describe('useTheme', () => {
  useStorageAndThemeCleanup();

  it('should initialize with default theme', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('should load saved theme from localStorage', () => {
    localStorage.setItem('whisperdesk_theme', 'dark');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('should toggle theme between light and dark', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('should set specific theme', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.isDark).toBe(false);
  });

  it('should apply theme to document element', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => {
      result.current.setTheme('light');
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should persist theme to localStorage on change', () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorage.getItem('whisperdesk_theme')).toBe('dark');

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem('whisperdesk_theme')).toBe('light');
  });

  it('should handle invalid stored theme gracefully', () => {
    localStorage.setItem('whisperdesk_theme', 'invalid-theme');

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('light');
  });
});
