import { useEffect, useRef } from 'react';

export const useAnimationFrame = (callback: (time: number) => void, enabled = true): void => {
  const callbackRef = useRef(callback);
  const requestRef = useRef<number | null>(null);

  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const tick = (time: number): void => {
      callbackRef.current(time);
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [enabled]);
};
