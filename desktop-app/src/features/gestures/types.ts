export type GestureName = 'fist' | 'open_hand' | 'pinch' | 'thumbs_up';

export type GestureAction = 'setLowPassFrequency' | 'setOutputGain' | 'toggleLowPassFocus';
export type GestureTriggerMode = 'continuous' | 'edge';

export const GESTURE_NAMES: GestureName[] = ['fist', 'open_hand', 'pinch', 'thumbs_up'];

export const GESTURE_ACTIONS: GestureAction[] = ['setLowPassFrequency', 'setOutputGain', 'toggleLowPassFocus'];

export const GESTURE_TRIGGER_MODES: GestureTriggerMode[] = ['continuous', 'edge'];

export type GestureEvent = {
  gesture: GestureName;
  confidence: number;
  value?: number;
  timestamp: number;
};

export type GestureMappingRule = {
  gesture: GestureName;
  action: GestureAction;
  triggerMode: GestureTriggerMode;
};
