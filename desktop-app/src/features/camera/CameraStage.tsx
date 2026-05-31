import type { ReactElement, ReactNode } from 'react';
import { Box } from '@mui/material';

type CameraStageProps = {
  children: ReactNode;
};

export const CameraStage = ({ children }: CameraStageProps): ReactElement => {
  return <Box className="camera-stage">{children}</Box>;
};
