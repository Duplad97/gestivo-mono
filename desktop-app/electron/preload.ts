import { contextBridge, ipcRenderer } from 'electron';
import type { PersistedAppPreferences } from '../src/types/preferences';

type SaveResult = {
  canceled: boolean;
  filePath?: string;
};

const api = {
  saveRecording: (data: ArrayBuffer, defaultFileName: string): Promise<SaveResult> => {
    return ipcRenderer.invoke('recording:save', data, defaultFileName);
  },
  loadPreferences: (): Promise<PersistedAppPreferences | null> => {
    return ipcRenderer.invoke('preferences:load');
  },
  savePreferences: (preferences: PersistedAppPreferences): Promise<void> => {
    return ipcRenderer.invoke('preferences:save', preferences);
  },
  toggleWindowFullscreen: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:toggle-fullscreen');
  },
  isWindowFullscreen: (): Promise<boolean> => {
    return ipcRenderer.invoke('window:is-fullscreen');
  }
};

contextBridge.exposeInMainWorld('gestivo', api);
