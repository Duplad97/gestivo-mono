export type GestureName = 'fist' | 'open_hand' | 'pinch' | 'thumbs_up';

export type GestureAction = 'setLowPassFrequency' | 'setOutputGain' | 'toggleLowPassFocus';

export const GESTURE_NAMES: GestureName[] = ['fist', 'open_hand', 'pinch', 'thumbs_up'];

export const GESTURE_ACTIONS: GestureAction[] = ['setLowPassFrequency', 'setOutputGain', 'toggleLowPassFocus'];

export type GestureEvent = {
  gesture: GestureName;
  confidence: number;
  value?: number;
  timestamp: number;
};

export type GestureMappingRule = {
  gesture: GestureName;
  action: GestureAction;
};
