import { create } from 'zustand';
import type { GestureMappingRule } from '../features/gestures/types';
import type { AppSettings } from '../features/settings/types';
import type { PersistedAppPreferences } from '../types/preferences';

type AppState = {
  lowPassFrequency: number;
  highPassFrequency: number;
  outputGain: number;
  recordingActive: boolean;
  settings: AppSettings;
  gestureMappings: GestureMappingRule[];
  setLowPassFrequency: (value: number) => void;
  setHighPassFrequency: (value: number) => void;
  setOutputGain: (value: number) => void;
  setRecordingActive: (value: boolean) => void;
  setGestureDebugOverlayEnabled: (value: boolean) => void;
  setGestureMapping: (index: number, mapping: GestureMappingRule) => void;
  hydratePreferences: (preferences: PersistedAppPreferences) => void;
};

const defaultSettings: AppSettings = {
  themeMode: 'system',
  enableGestureDebugOverlay: true
};

const defaultGestureMappings: GestureMappingRule[] = [
  { gesture: 'fist', action: 'toggleLowPassFocus' },
  { gesture: 'pinch', action: 'setLowPassFrequency' },
  { gesture: 'thumbs_up', action: 'setOutputGain' }
];

export const getPersistedAppPreferences = (state: Pick<AppState, 'settings' | 'gestureMappings'>): PersistedAppPreferences => ({
  settings: state.settings,
  gestureMappings: state.gestureMappings
});

export const useAppStore = create<AppState>((set) => ({
  lowPassFrequency: 12000,
  highPassFrequency: 20,
  outputGain: 1,
  recordingActive: false,
  settings: defaultSettings,
  gestureMappings: defaultGestureMappings,
  setLowPassFrequency: (value) => set({ lowPassFrequency: value }),
  setHighPassFrequency: (value) => set({ highPassFrequency: value }),
  setOutputGain: (value) => set({ outputGain: value }),
  setRecordingActive: (value) => set({ recordingActive: value }),
  setGestureDebugOverlayEnabled: (value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        enableGestureDebugOverlay: value
      }
    })),
  setGestureMapping: (index, mapping) =>
    set((state) => ({
      gestureMappings: state.gestureMappings.map((currentMapping, currentIndex) => {
        if (currentIndex !== index) {
          return currentMapping;
        }

        return mapping;
      })
    })),
  hydratePreferences: (preferences) =>
    set({
      settings: preferences.settings,
      gestureMappings: preferences.gestureMappings
    })
}));
