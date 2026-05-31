import { useEffect, useMemo, useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { GestureFrame } from './GestureDetector';

const CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

type GestureOverlayProps = {
  frame: GestureFrame | null;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export const GestureOverlay = ({ frame, videoRef }: GestureOverlayProps): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const overlayLabel = useMemo(() => {
    if (!frame?.gesture) {
      return 'No classified gesture';
    }

    const confidence = Math.round(frame.gesture.confidence * 100);
    return `${frame.gesture.name} ${confidence}%`;
  }, [frame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      return;
    }

    const width = video.clientWidth;
    const height = video.clientHeight;

    if (width === 0 || height === 0) {
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.clearRect(0, 0, width, height);

    if (!frame?.hasHand) {
      return;
    }

    context.strokeStyle = 'rgba(123, 241, 168, 0.85)';
    context.lineWidth = 2;

    CONNECTIONS.forEach(([startIndex, endIndex]) => {
      const start = frame.landmarks[startIndex];
      const end = frame.landmarks[endIndex];

      if (!start || !end) {
        return;
      }

      context.beginPath();
      context.moveTo(start.x * width, start.y * height);
      context.lineTo(end.x * width, end.y * height);
      context.stroke();
    });

    frame.landmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;

      context.beginPath();
      context.fillStyle = index === 8 || index === 4 ? '#ffbf69' : '#8ec5ff';
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
    });
  }, [frame, videoRef]);

  return (
    <>
      <canvas ref={canvasRef} className="gesture-overlay" />
      <Box className="camera-hud">
        <Stack spacing={0.25}>
          <Typography variant="caption" sx={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Gesture Debug
          </Typography>
          <Typography variant="body2">{overlayLabel}</Typography>
          <Typography variant="caption" color="text.secondary">
            {frame?.hasHand ? `${frame.landmarks.length} landmarks tracked` : 'Point your hand toward the camera'}
          </Typography>
        </Stack>
      </Box>
    </>
  );
};
