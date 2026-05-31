import { useEffect, useEffectEvent, useState } from 'react';
import type { RefObject } from 'react';
import { type GestureDetector, type GestureFrame } from '../../features/gestures/GestureDetector';
import type { GestureEvent, GestureMappingRule } from '../../features/gestures/types';

type UseGestureTrackingParams = {
  cameraStream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  gestureMappings: GestureMappingRule[];
  gestureDetector: GestureDetector;
  onGestureEvent: (event: GestureEvent) => void;
};

type UseGestureTrackingResult = {
  gestureError: string | null;
  gestureFrame: GestureFrame | null;
};

export const useGestureTracking = ({
  cameraStream,
  videoRef,
  gestureMappings,
  gestureDetector,
  onGestureEvent
}: UseGestureTrackingParams): UseGestureTrackingResult => {
  const [gestureError, setGestureError] = useState<string | null>(null);
  const [gestureFrame, setGestureFrame] = useState<GestureFrame | null>(null);
  const onGestureEventEffect = useEffectEvent(onGestureEvent);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!cameraStream || !videoElement) {
      gestureDetector.stop();
      setGestureFrame(null);
      return;
    }

    let cancelled = false;

    const startDetection = async (): Promise<void> => {
      try {
        await gestureDetector.start(videoElement, (event) => {
          if (!cancelled) {
            onGestureEventEffect(event);
          }
        }, (frame) => {
          if (!cancelled) {
            setGestureFrame(frame);
          }
        });
        setGestureError(null);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Gesture detection failed to initialize';
          setGestureError(message);
        }
      }
    };

    void startDetection();

    return () => {
      cancelled = true;
      setGestureFrame(null);
      gestureDetector.stop();
    };
  }, [cameraStream, gestureDetector, gestureMappings, videoRef]);

  useEffect(() => {
    return () => {
      gestureDetector.dispose();
    };
  }, [gestureDetector]);

  return {
    gestureError,
    gestureFrame
  };
};