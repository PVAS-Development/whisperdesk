import { app, BrowserWindow, Menu, shell, dialog } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc';
import packageJson from '../../package.json';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const appVersion = packageJson.version;

function createMenu() {
  if (!mainWindow) return;

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu:openFile');
          },
        },
        {
          label: 'Save Transcription...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:saveFile');
          },
        },
        { type: 'separator' as const },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' as const },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' as const },
        {
          label: 'Copy All Transcription',
          accelerator: 'CmdOrCtrl+C',
          click: () => {
            mainWindow?.webContents.send('menu:copyTranscription');
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' as const },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' as const },
        { role: 'togglefullscreen' },
        {
          label: 'Toggle History',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow?.webContents.send('menu:toggleHistory');
          },
        },
      ],
    },
    {
      label: 'Transcription',
      submenu: [
        {
          label: 'Start Transcription',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => {
            mainWindow?.webContents.send('menu:startTranscription');
          },
        },
        {
          label: 'Cancel Transcription',
          accelerator: 'Escape',
          click: () => {
            mainWindow?.webContents.send('menu:cancelTranscription');
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin'
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
            ]
          : [{ role: 'close' as const }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About WhisperDesk',
          click: async () => {
            const author = 'Pedro Siqueira';
            const githubUrl = 'https://github.com/pedrovsiqueira';
            const linkedinUrl = 'https://www.linkedin.com/in/pedrovsiqueira';

            const result = await dialog.showMessageBox({
              type: 'info',
              title: 'About WhisperDesk',
              message: `WhisperDesk ${appVersion}`,
              detail: `Author: ${author}`,
              buttons: ['Open GitHub', 'Open LinkedIn', 'Close'],
              cancelId: 2,
            });

            if (result.response === 0) {
              await shell.openExternal(githubUrl);
            } else if (result.response === 1) {
              await shell.openExternal(linkedinUrl);
            }
          },
        },
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/pedrovsiqueira/whisperdesk');
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' as const },
        { role: 'services' },
        { type: 'separator' as const },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' as const },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 20 },
  });

  registerIpcHandlers(mainWindow);

  createMenu();

  if (isDev) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] || 'http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
