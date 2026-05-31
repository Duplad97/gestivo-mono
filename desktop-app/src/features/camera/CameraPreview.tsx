import { useEffect } from 'react';
import type { ReactElement } from 'react';
import type { RefObject } from 'react';

type CameraPreviewProps = {
  stream: MediaStream | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export const CameraPreview = ({ stream, videoRef }: CameraPreviewProps): ReactElement => {
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
