import { BrowserWindow, screen } from 'electron';
import path from 'path';

export interface OverlayState {
  status: 'recording' | 'processing' | 'success' | 'error' | 'idle';
  message?: string;
}

const OVERLAY_WIDTH = 280;
const OVERLAY_HEIGHT = 56;
const AUTO_HIDE_SUCCESS_MS = 2000;
const AUTO_HIDE_ERROR_MS = 4000;

function generateOverlayHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background: transparent;
    overflow: hidden;
    user-select: none;
    -webkit-app-region: drag;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  }
  #pill {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 22px;
    border-radius: 28px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.2px;
    color: #1d1d1f;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  #pill.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Icons */
  .icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  /* Recording: red pulsing dot */
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ff3b30;
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }

  /* Processing: spinning ring */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0,122,255,0.25);
    border-top-color: #007aff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Success: checkmark */
  .check {
    color: #34c759;
    font-size: 16px;
    line-height: 1;
  }

  /* Error: warning */
  .warn {
    color: #ff9500;
    font-size: 16px;
    line-height: 1;
  }

  /* State colors */
  .recording { color: #1d1d1f; }
  .processing { color: #1d1d1f; }
  .success { color: #1d1d1f; }
  .error { color: #1d1d1f; }

  @media (prefers-color-scheme: dark) {
    #pill {
      color: #f5f5f7;
    }
    .recording, .processing, .success, .error {
      color: #f5f5f7;
    }
  }
</style>
</head>
<body>
  <div id="pill">
    <div id="icon" class="icon"></div>
    <span id="text"></span>
  </div>
  <script>
    const pill = document.getElementById('pill');
    const icon = document.getElementById('icon');
    const text = document.getElementById('text');

    const ICONS = {
      recording: '<div class="dot"></div>',
      processing: '<div class="spinner"></div>',
      success: '<span class="check">\\u2713</span>',
      error: '<span class="warn">\\u26A0</span>',
    };

    window.overlayAPI.onStateUpdate((state) => {
      if (state.status === 'idle') {
        pill.classList.remove('visible');
        return;
      }

      pill.className = state.status;
      icon.innerHTML = ICONS[state.status] || '';
      text.textContent = state.message || '';
      pill.classList.add('visible');
    });
  </script>
</body>
</html>`;
}

export class OverlayWindow {
  private window: BrowserWindow | null = null;
  private hideTimer: NodeJS.Timeout | null = null;

  create(): void {
    if (this.window) return;

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    this.window = new BrowserWindow({
      width: OVERLAY_WIDTH,
      height: OVERLAY_HEIGHT,
      x: Math.round(screenWidth / 2 - OVERLAY_WIDTH / 2),
      y: screenHeight - 100,
      alwaysOnTop: true,
      frame: false,
      transparent: true,
      resizable: false,
      movable: true,
      skipTaskbar: true,
      type: 'panel',
      vibrancy: 'popover',
      hasShadow: true,
      show: false,
      focusable: false,
      webPreferences: {
        preload: path.join(__dirname, 'overlayPreload.cjs'),
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
      },
    });

    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    this.window.setAlwaysOnTop(true, 'floating');

    const html = generateOverlayHTML();
    this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  updateState(state: OverlayState): void {
    if (!this.window) return;

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    if (state.status === 'idle') {
      this.window.webContents.send('overlay:update', state);
      // Delay hiding the window so the fade-out transition plays
      this.hideTimer = setTimeout(() => {
        this.window?.hide();
      }, 250);
      return;
    }

    // Show window and send state
    if (!this.window.isVisible()) {
      this.window.showInactive();
    }
    this.window.webContents.send('overlay:update', state);

    // Auto-hide for transient states
    if (state.status === 'success') {
      this.hideTimer = setTimeout(() => {
        this.updateState({ status: 'idle' });
      }, AUTO_HIDE_SUCCESS_MS);
    } else if (state.status === 'error') {
      this.hideTimer = setTimeout(() => {
        this.updateState({ status: 'idle' });
      }, AUTO_HIDE_ERROR_MS);
    }
  }

  destroy(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (this.window) {
      this.window.destroy();
      this.window = null;
    }
  }
}
