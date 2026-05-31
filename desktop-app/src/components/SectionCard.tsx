import { Box, Paper, Typography } from '@mui/material';
import type { PropsWithChildren } from 'react';
import type { ReactElement } from 'react';

type SectionCardProps = PropsWithChildren<{
  title: string;
}>;

export const SectionCard = ({ title, children }: SectionCardProps): ReactElement => {
  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid rgba(255,255,255,0.16)' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Box>{children}</Box>
    </Paper>
  );
};
