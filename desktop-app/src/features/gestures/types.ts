export type GestureName = 'fist' | 'open_hand' | 'pinch' | 'thumbs_up';

export type GestureAction = 'setLowPassFrequency' | 'setOutputGain' | 'toggleLowPassFocus';

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
