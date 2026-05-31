import type { GestureEvent, GestureMappingRule } from './types';

export type GestureActionResult = {
  action: GestureMappingRule['action'];
  value?: number;
};

export const mapGestureToAction = (
  event: GestureEvent,
  rules: GestureMappingRule[]
): GestureActionResult | null => {
  const match = rules.find((rule) => rule.gesture === event.gesture);

  if (!match) {
    return null;
  }

  if (match.action === 'setLowPassFrequency') {
    const normalized = event.value ?? 0.5;
    return {
      action: match.action,
      value: 500 + normalized * 14000
    };
  }

  if (match.action === 'setOutputGain') {
    return {
      action: match.action,
      value: 0.4 + (event.value ?? 0.4) * 1.2
    };
  }

  return {
    action: match.action
  };
};
