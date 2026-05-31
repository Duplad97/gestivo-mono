import { useCallback, useEffect, useRef, useState } from 'react';

type CameraState = {
  stream: MediaStream | null;
  start: () => Promise<MediaStream>;
  stop: () => void;
  error: string | null;
  isActive: boolean;
};

export const useCameraStream = (): CameraState => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async (): Promise<MediaStream> => {
    try {
      if (streamRef.current) {
        return streamRef.current;
      }

      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = nextStream;
      setStream(nextStream);
      setError(null);

      return nextStream;
    } catch (error) {
      let message = 'Unable to access webcam.';

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          message = 'Camera permission denied. Allow camera access in macOS Privacy settings and restart the app.';
        } else if (error.name === 'NotFoundError') {
          message = 'No camera device was found.';
        } else if (error.name === 'NotReadableError') {
          message = 'Camera is busy in another app. Close other apps using the camera and try again.';
        } else {
          message = `Unable to access webcam (${error.name}).`;
        }
      }

      console.error('Camera start failed:', error);
      setError(message);
      throw new Error(message);
    }
  }, []);

  useEffect(() => stop, [stop]);

  return {
    stream,
    start,
    stop,
    error,
    isActive: stream !== null
  };
};
