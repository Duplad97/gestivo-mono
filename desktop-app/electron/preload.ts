import { contextBridge, ipcRenderer } from 'electron';

type SaveResult = {
  canceled: boolean;
  filePath?: string;
};

const api = {
  saveRecording: (data: ArrayBuffer, defaultFileName: string): Promise<SaveResult> => {
    return ipcRenderer.invoke('recording:save', data, defaultFileName);
  }
};

contextBridge.exposeInMainWorld('gestivo', api);
