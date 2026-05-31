import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

type CameraPreviewProps = {
  stream: MediaStream | null;
};

export const CameraPreview = ({ stream }: CameraPreviewProps): ReactElement => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    videoElement.srcObject = stream;

    if (stream) {
      void videoElement.play();
    }
  }, [stream]);

  return <video ref={videoRef} muted playsInline />;
};
