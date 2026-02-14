import { uIOhook } from 'uiohook-napi';
import type { UiohookKeyboardEvent } from 'uiohook-napi';
import { globalShortcut } from 'electron';
import { EventEmitter } from 'events';
import type { ShortcutMode } from '../../shared/types';

export class GlobalShortcutService extends EventEmitter {
  private targetKeyCode = 0;
  private isHolding = false;
  private started = false;
  private mode: ShortcutMode = 'hold';
  private toggleRecording = false;
  private keydownHandler: ((e: UiohookKeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: UiohookKeyboardEvent) => void) | null = null;

  setShortcut(keyCode: number, mode: ShortcutMode): void {
    this.targetKeyCode = keyCode;
    this.mode = mode;
  }

  start(): void {
    if (this.started) return;

    if (this.mode === 'hold') {
      this.startHoldMode();
    } else {
      this.startToggleMode();
    }

    this.started = true;
  }

  stop(): void {
    if (!this.started) return;

    if (this.mode === 'hold') {
      this.stopHoldMode();
    } else {
      this.stopToggleMode();
    }

    this.started = false;

    if (this.isHolding) {
      this.isHolding = false;
      this.emit('shortcut-hold-end');
    }
    this.toggleRecording = false;
  }

  private startHoldMode(): void {
    this.keydownHandler = (e: UiohookKeyboardEvent) => {
      if (e.keycode === this.targetKeyCode && !this.isHolding) {
        this.isHolding = true;
        this.emit('shortcut-hold-start');
      }
    };

    this.keyupHandler = (e: UiohookKeyboardEvent) => {
      if (e.keycode === this.targetKeyCode && this.isHolding) {
        this.isHolding = false;
        this.emit('shortcut-hold-end');
      }
    };

    uIOhook.on('keydown', this.keydownHandler);
    uIOhook.on('keyup', this.keyupHandler);
    uIOhook.start();
  }

  private stopHoldMode(): void {
    if (this.keydownHandler) {
      uIOhook.off('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.keyupHandler) {
      uIOhook.off('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }
    uIOhook.stop();
  }

  private startToggleMode(): void {
    // Use Electron's globalShortcut for toggle mode (simpler, no native addon needed at runtime)
    // Map Right Option to 'Right Alt' accelerator
    const accelerator = 'Alt+Right';
    try {
      globalShortcut.register(accelerator, () => {
        if (!this.toggleRecording) {
          this.toggleRecording = true;
          this.emit('shortcut-hold-start');
        } else {
          this.toggleRecording = false;
          this.emit('shortcut-hold-end');
        }
      });
    } catch (err) {
      console.error('Failed to register global shortcut:', err);
    }
  }

  private stopToggleMode(): void {
    globalShortcut.unregisterAll();
  }
}
