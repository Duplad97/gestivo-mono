import type { GestureAction, GestureName, GestureTriggerMode } from '../features/gestures/types';
import type { RecordingMode } from '../features/settings/types';

export const discreteGestureCooldownMs = 900;

export const gestureLabels: Record<GestureName, string> = {
  fist: 'Fist',
  open_hand: 'Open Hand',
  pinch: 'Pinch',
  thumbs_up: 'Thumbs Up'
};

export const actionLabels: Record<GestureAction, string> = {
  setLowPassFrequency: 'Adjust Brightness',
  setOutputGain: 'Adjust Volume',
  toggleLowPassFocus: 'Toggle Muffled Focus'
};

export const triggerModeLabels: Record<GestureTriggerMode, string> = {
  continuous: 'While Held',
  edge: 'Once Per Gesture'
};

export const panelSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: '24px'
} as const;

export const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
    '& fieldset': {
      borderColor: 'rgba(255,255,255,0.1)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(127,240,210,0.28)'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#7ff0d2'
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(226,232,255,0.62)'
  }
} as const;

export const nowFileName = (mode: RecordingMode): string => {
  const date = new Date();
  const iso = date.toISOString().replace(/[:.]/g, '-');
  return `gestivo-${mode}-${iso}.webm`;
};