import type { GestureEvent, GestureMappingRule } from './types';

export type GestureActionResult = {
  action: GestureMappingRule['action'];
  triggerMode: GestureMappingRule['triggerMode'];
  value?: number;
};

const toGestureActionResult = (event: GestureEvent, match: GestureMappingRule): GestureActionResult => {
  if (match.action === 'setLowPassFrequency') {
    const normalized = event.value ?? 0.5;
    return {
      action: match.action,
      triggerMode: match.triggerMode,
      value: 500 + normalized * 14000
    };
  }

  if (match.action === 'setOutputGain') {
    return {
      action: match.action,
      triggerMode: match.triggerMode,
      value: 0.4 + (event.value ?? 0.4) * 1.2
    };
  }

  return {
    action: match.action,
    triggerMode: match.triggerMode
  };
};

export const mapGestureToActions = (
  event: GestureEvent,
  rules: GestureMappingRule[]
): GestureActionResult[] => {
  return rules.filter((rule) => rule.gesture === event.gesture).map((rule) => toGestureActionResult(event, rule));
};

export const mapGestureToAction = (
  event: GestureEvent,
  rules: GestureMappingRule[]
): GestureActionResult | null => {
  return mapGestureToActions(event, rules)[0] ?? null;
};
