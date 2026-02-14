import { Tray, Menu, nativeImage, app } from 'electron';
import type { BrowserWindow } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(getMainWindow: () => BrowserWindow | null): Tray {
  const isDev = !app.isPackaged;

  const iconPath = isDev
    ? path.join(process.cwd(), 'build', 'tray-iconTemplate.png')
    : path.join(process.resourcesPath, 'tray-iconTemplate.png');

  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('Speakly');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Speakly',
      click: () => {
        const win = getMainWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Speakly',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  return tray;
}

export function updateTrayTooltip(status: string): void {
  if (tray) {
    tray.setToolTip(`Speakly — ${status}`);
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
