export type ThemeMode = 'light' | 'dark' | 'system';

export type RecordingMode = 'audio' | 'video';

export type AppSettings = {
  themeMode: ThemeMode;
  enableGestureDebugOverlay: boolean;
  recordingMode: RecordingMode;
  preferredCameraDeviceId: string | null;
  preferredMicrophoneDeviceId: string | null;
};
