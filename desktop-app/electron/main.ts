import { app, BrowserWindow, dialog, ipcMain, session, systemPreferences } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PersistedAppPreferences } from '../src/types/preferences';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
const preferencesFilePath = (): string => path.join(app.getPath('userData'), 'preferences.json');

const isMediaPermission = (permission: string): boolean => {
  return permission === 'media' || permission === 'camera' || permission === 'microphone' || permission === 'display-capture';
};

const configureMediaPermissions = (): void => {
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (isMediaPermission(permission)) {
      return true;
    }

    return false;
  });

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(isMediaPermission(permission));
  });
};

const requestMacOSMediaAccess = async (): Promise<void> => {
  if (process.platform !== 'darwin') {
    return;
  }

  await systemPreferences.askForMediaAccess('camera');
  await systemPreferences.askForMediaAccess('microphone');
};

const createWindow = async (): Promise<void> => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
    return;
  }

  await win.loadFile(path.join(__dirname, '../dist/index.html'));
};

ipcMain.handle('recording:save', async (_event, data: ArrayBuffer, defaultFileName: string) => {
  const saveResult = await dialog.showSaveDialog({
    defaultPath: defaultFileName,
    filters: [
      { name: 'WebM file', extensions: ['webm'] },
      { name: 'Wave file', extensions: ['wav'] }
    ]
  });

  if (saveResult.canceled || !saveResult.filePath) {
    return { canceled: true };
  }

  const buffer = Buffer.from(data);
  await fs.writeFile(saveResult.filePath, buffer);

  return { canceled: false, filePath: saveResult.filePath };
});

ipcMain.handle('preferences:load', async (): Promise<PersistedAppPreferences | null> => {
  try {
    const fileContents = await fs.readFile(preferencesFilePath(), 'utf-8');
    return JSON.parse(fileContents) as PersistedAppPreferences;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
});

ipcMain.handle('preferences:save', async (_event, preferences: PersistedAppPreferences): Promise<void> => {
  await fs.writeFile(preferencesFilePath(), JSON.stringify(preferences, null, 2), 'utf-8');
});

app.whenReady().then(() => {
  configureMediaPermissions();
  void requestMacOSMediaAccess();
  void createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
