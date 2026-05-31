import { useRef, useState } from 'react';
import type { GestureActionResult } from '../../features/gestures/GestureMapper';
import { mapGestureToActions } from '../../features/gestures/GestureMapper';
import type { GestureEvent, GestureMappingRule } from '../../features/gestures/types';
import { discreteGestureCooldownMs } from '../config';

type UseGestureRouterParams = {
  gestureMappings: GestureMappingRule[];
  setLowPassFrequency: (value: number) => void;
  setOutputGain: (value: number) => void;
};

type UseGestureRouterResult = {
  lastGesture: GestureEvent | null;
  handleGestureEvent: (event: GestureEvent) => void;
};

const shouldSkipDiscreteAction = (
  event: GestureEvent,
  action: GestureActionResult,
  lastDiscreteGesture: { gesture: string; action: string; timestamp: number } | null
): boolean => {
  if (!lastDiscreteGesture) {
    return false;
  }

  return (
    lastDiscreteGesture.gesture === event.gesture &&
    lastDiscreteGesture.action === action.action &&
    event.timestamp - lastDiscreteGesture.timestamp < discreteGestureCooldownMs
  );
};

export const useGestureRouter = ({
  gestureMappings,
  setLowPassFrequency,
  setOutputGain
}: UseGestureRouterParams): UseGestureRouterResult => {
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const lowPassFocusEnabledRef = useRef(false);
  const lastDiscreteGestureRef = useRef<{ gesture: string; action: string; timestamp: number } | null>(null);

  const handleGestureEvent = (event: GestureEvent): void => {
    setLastGesture(event);

    const actions = mapGestureToActions(event, gestureMappings);

    if (actions.length === 0) {
      return;
    }

    actions.forEach((action) => {
      if (action.triggerMode === 'edge') {
        const lastDiscreteGesture = lastDiscreteGestureRef.current;

        if (shouldSkipDiscreteAction(event, action, lastDiscreteGesture)) {
          return;
        }

        lastDiscreteGestureRef.current = {
          gesture: event.gesture,
          action: action.action,
          timestamp: event.timestamp
        };
      }

      if (action.action === 'setLowPassFrequency' && action.value !== undefined) {
        setLowPassFrequency(action.value);
        return;
      }

      if (action.action === 'setOutputGain' && action.value !== undefined) {
        setOutputGain(action.value);
        return;
      }

      if (action.action === 'toggleLowPassFocus') {
        lowPassFocusEnabledRef.current = !lowPassFocusEnabledRef.current;
        setLowPassFrequency(lowPassFocusEnabledRef.current ? 1800 : 12000);
      }
    });
  };

  return {
    lastGesture,
    handleGestureEvent
  };
};