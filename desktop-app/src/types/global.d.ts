import type { PersistedAppPreferences } from './preferences';

type SaveResult = {
  canceled: boolean;
  filePath?: string;
};

type GestivoApi = {
  saveRecording: (data: ArrayBuffer, defaultFileName: string) => Promise<SaveResult>;
  loadPreferences: () => Promise<PersistedAppPreferences | null>;
  savePreferences: (preferences: PersistedAppPreferences) => Promise<void>;
};

declare global {
  interface Window {
    gestivo: GestivoApi;
  }
}

export {};
