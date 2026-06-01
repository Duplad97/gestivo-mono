import { useEffect } from 'react';
import type { ReactElement } from 'react';
import type { RefObject } from 'react';
import VideocamOffRoundedIcon from '@mui/icons-material/VideocamOffRounded';
import { Box, Typography } from '@mui/material';

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

  return (
    <>
      <video ref={videoRef} muted playsInline className={!stream ? 'is-hidden' : undefined} />
      {!stream ? (
        <Box className="camera-placeholder">
          <Box className="camera-placeholder-icon">
            <VideocamOffRoundedIcon fontSize="medium" />
          </Box>
          <Typography variant="h6">Camera standby</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, textAlign: 'center' }}>
            Start inputs to bring the live camera feed online for gesture tracking and recording.
          </Typography>
        </Box>
      ) : null}
    </>
  );
};
