import { create } from 'zustand';
import type { GestureMappingRule } from '../features/gestures/types';

type AppState = {
  lowPassFrequency: number;
  highPassFrequency: number;
  outputGain: number;
  recordingActive: boolean;
  gestureMappings: GestureMappingRule[];
  setLowPassFrequency: (value: number) => void;
  setHighPassFrequency: (value: number) => void;
  setOutputGain: (value: number) => void;
  setRecordingActive: (value: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  lowPassFrequency: 12000,
  highPassFrequency: 20,
  outputGain: 1,
  recordingActive: false,
  gestureMappings: [
    { gesture: 'fist', action: 'toggleLowPassFocus' },
    { gesture: 'pinch', action: 'setLowPassFrequency' },
    { gesture: 'thumbs_up', action: 'setOutputGain' }
  ],
  setLowPassFrequency: (value) => set({ lowPassFrequency: value }),
  setHighPassFrequency: (value) => set({ highPassFrequency: value }),
  setOutputGain: (value) => set({ outputGain: value }),
  setRecordingActive: (value) => set({ recordingActive: value })
}));
