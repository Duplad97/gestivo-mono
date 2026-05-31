type SaveResult = {
  canceled: boolean;
  filePath?: string;
};

type GestivoApi = {
  saveRecording: (data: ArrayBuffer, defaultFileName: string) => Promise<SaveResult>;
};

declare global {
  interface Window {
    gestivo: GestivoApi;
  }
}

export {};
