import { app, BrowserWindow, dialog, ipcMain, nativeImage, session, systemPreferences } from 'electron';
import { autoUpdater } from 'electron-updater';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PersistedAppPreferences } from '../src/types/preferences';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_NAME = 'Gestivo';
const SPLASH_MIN_DURATION_MS = 1100;
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;
const isDev = process.env.VITE_DEV_SERVER_URL !== undefined;
let mainWindow: BrowserWindow | null = null;
let autoUpdaterInitialized = false;
let updateCheckInterval: NodeJS.Timeout | null = null;
const preferencesFilePath = (): string => path.join(app.getPath('userData'), 'preferences.json');
const publicAssetPath = (fileName: string): string => path.join(isDev ? process.cwd() : path.join(__dirname, '../dist'), isDev ? 'public' : '', fileName);

app.setName(APP_NAME);

const imageMimeType = (fileName: string): string => {
  if (fileName.endsWith('.png')) {
    return 'image/png';
  }

  return 'application/octet-stream';
};

const assetDataUrl = async (fileName: string): Promise<string> => {
  const assetPath = publicAssetPath(fileName);
  const fileBuffer = await fs.readFile(assetPath);
  return `data:${imageMimeType(fileName)};base64,${fileBuffer.toString('base64')}`;
};

const appIcon = () => nativeImage.createFromPath(publicAssetPath('logo.png'));

const logAutoUpdaterError = (context: string, error: unknown): void => {
  console.error(`[auto-updater] ${context}`, error);
};

const checkForUpdates = async (): Promise<void> => {
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    logAutoUpdaterError('Failed to check for updates.', error);
  }
};

const configureAutoUpdater = (window: BrowserWindow): void => {
  mainWindow = window;

  if (isDev || autoUpdaterInitialized) {
    return;
  }

  autoUpdaterInitialized = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (error) => {
    logAutoUpdaterError('Updater error.', error);
  });

  autoUpdater.on('update-downloaded', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1,
      title: `${APP_NAME} update ready`,
      message: 'A new version of Gestivo has been downloaded.',
      detail: 'Restart now to install the update and relaunch the app.'
    });

    if (result.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });

  void autoUpdater.checkForUpdatesAndNotify().catch((error) => {
    logAutoUpdaterError('Initial update check failed.', error);
  });

  if (!updateCheckInterval) {
    updateCheckInterval = setInterval(() => {
      void checkForUpdates();
    }, UPDATE_CHECK_INTERVAL_MS);
  }
};

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

const createSplashWindow = async (): Promise<BrowserWindow> => {
  const splash = new BrowserWindow({
    width: 620,
    height: 520,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    center: true,
    show: true,
    backgroundColor: '#00000000',
    title: `${APP_NAME} Splash`,
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const logoDataUrl = await assetDataUrl('logo_full.png');
  const splashHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${APP_NAME}</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Space Grotesk", "Sora", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        padding: 18px;
        display: grid;
        place-items: center;
        overflow: hidden;
        background:
          radial-gradient(circle at top, rgba(127, 240, 210, 0.22), transparent 30%),
          radial-gradient(circle at 80% 18%, rgba(255, 142, 66, 0.22), transparent 26%),
          linear-gradient(180deg, #03050b 0%, #070b17 58%, #04060d 100%);
      }

      body::before,
      body::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      body::before {
        background: linear-gradient(115deg, transparent 0%, rgba(255, 255, 255, 0.06) 18%, transparent 42%);
        transform: translateX(-100%);
        animation: sweep 3.8s ease-in-out infinite;
      }

      body::after {
        background-image: linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
        background-size: 26px 26px;
        mask-image: radial-gradient(circle at center, black 40%, transparent 82%);
        opacity: 0.32;
      }

      .splash-shell {
        position: relative;
        width: min(540px, calc(100vw - 36px));
        padding: 28px 28px 24px;
        border-radius: 30px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: linear-gradient(180deg, rgba(14, 18, 34, 0.82), rgba(7, 10, 20, 0.92));
        box-shadow: 0 32px 90px rgba(0, 0, 0, 0.52), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(20px);
        overflow: hidden;
        isolation: isolate;
      }

      .splash-shell::before {
        content: "";
        position: absolute;
        inset: auto -10% -38% auto;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(127, 240, 210, 0.34), transparent 68%);
        filter: blur(8px);
        animation: pulse 3.2s ease-in-out infinite;
        z-index: -1;
      }

      .splash-shell::after {
        content: "";
        position: absolute;
        inset: -24% auto auto -12%;
        width: 220px;
        height: 220px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 142, 66, 0.24), transparent 70%);
        filter: blur(16px);
        animation: drift 5.4s ease-in-out infinite;
        z-index: -1;
      }

      .logo-frame {
        position: relative;
        display: grid;
        place-items: center;
        min-height: 140px;
        margin-bottom: 14px;
      }

      .logo-frame::before {
        content: "";
        position: absolute;
        inset: 18% 8%;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(127, 240, 210, 0.24), transparent 62%);
        filter: blur(28px);
      }

      .logo {
        position: relative;
        width: min(320px, 72%);
        filter: drop-shadow(0 18px 42px rgba(0, 0, 0, 0.42));
        animation: float 2.8s ease-in-out infinite;
      }

      .eyebrow {
        margin: 0 0 6px;
        color: rgba(226, 232, 255, 0.58);
        font-size: 11px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      .title {
        margin: 0;
        color: #eff3ff;
        font-size: 26px;
        line-height: 1.05;
        letter-spacing: -0.02em;
      }

      .copy {
        margin: 8px 0 16px;
        max-width: 400px;
        color: rgba(226, 232, 255, 0.72);
        font-size: 13px;
        line-height: 1.45;
      }

      .status-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-height: 38px;
        padding: 0 14px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.05);
        color: rgba(239, 243, 255, 0.86);
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #7ff0d2;
        box-shadow: 0 0 0 8px rgba(127, 240, 210, 0.12);
        animation: beacon 1.5s ease-in-out infinite;
      }

      .status-copy {
        color: rgba(226, 232, 255, 0.64);
        font-size: 12px;
      }

      @media (max-height: 560px) {
        body {
          padding: 14px;
        }

        .splash-shell {
          padding: 24px 24px 20px;
        }

        .logo-frame {
          min-height: 118px;
          margin-bottom: 12px;
        }

        .logo {
          width: min(280px, 68%);
        }

        .title {
          font-size: 23px;
        }

        .copy {
          margin-bottom: 14px;
          font-size: 12px;
        }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-8px) scale(1.01); }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(0.96); opacity: 0.66; }
        50% { transform: scale(1.04); opacity: 1; }
      }

      @keyframes drift {
        0%, 100% { transform: translate3d(0, 0, 0); }
        50% { transform: translate3d(16px, 18px, 0); }
      }

      @keyframes sweep {
        0% { transform: translateX(-120%); }
        55%, 100% { transform: translateX(120%); }
      }

      @keyframes beacon {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(0.84); opacity: 0.62; }
      }
    </style>
  </head>
  <body>
    <main class="splash-shell">
      <div class="logo-frame">
        <img class="logo" src="${logoDataUrl}" alt="${APP_NAME}" />
      </div>
      <p class="eyebrow">Creative Performance Suite</p>
      <h1 class="title">Launching ${APP_NAME}</h1>
      <p class="copy">Preparing the visual stage, audio engine, and gesture controls for a focused studio session.</p>
      <div class="status-row">
        <div class="status-pill">
          <span class="status-dot"></span>
          <span>Booting Studio</span>
        </div>
        <div class="status-copy">Vision, audio, and capture services are warming up.</div>
      </div>
    </main>
  </body>
</html>`;

  await splash.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(splashHtml)}`);
  return splash;
};

const createWindow = async (): Promise<void> => {
  const icon = appIcon();
  const splash = await createSplashWindow();
  const splashStartedAt = Date.now();
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    title: APP_NAME,
    icon: icon.isEmpty() ? undefined : icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow = win;

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
  });

  const finishLaunch = async (): Promise<void> => {
    const elapsed = Date.now() - splashStartedAt;
    if (elapsed < SPLASH_MIN_DURATION_MS) {
      await new Promise((resolve) => setTimeout(resolve, SPLASH_MIN_DURATION_MS - elapsed));
    }

    if (!splash.isDestroyed()) {
      splash.close();
    }

    win.show();
  };

  win.once('ready-to-show', () => {
    void finishLaunch();
  });

  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL as string);
    return;
  }

  await win.loadFile(path.join(__dirname, '../dist/index.html'));
  configureAutoUpdater(win);
};

ipcMain.handle('recording:save', async (_event, data: ArrayBuffer, defaultFileName: string) => {
  const saveResult = await dialog.showSaveDialog({
    title: 'Save Gestivo Recording',
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
  app.setName(APP_NAME);
  app.setAboutPanelOptions({ applicationName: APP_NAME, applicationVersion: app.getVersion() });

  const icon = appIcon();
  if (process.platform === 'darwin' && app.dock && !icon.isEmpty()) {
    app.dock.setIcon(icon);
  }

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
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
