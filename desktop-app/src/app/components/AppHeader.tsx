import type { ReactElement } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';

type AppHeaderProps = {
  activeScreen: 'studio' | 'settings';
  inputsActive: boolean;
  recordingActive: boolean;
  audioInitialized: boolean;
  isCameraActive: boolean;
  onToggleSettingsScreen: () => void;
  onStartSources: () => Promise<void>;
  onStopSources: () => Promise<void>;
};

export const AppHeader = ({
  activeScreen,
  inputsActive,
  recordingActive,
  audioInitialized,
  isCameraActive,
  onToggleSettingsScreen,
  onStartSources,
  onStopSources
}: AppHeaderProps): ReactElement => {
  return (
    <Stack spacing={1.25} sx={{ position: 'relative', pr: { xs: 7, md: 8 } }}>
      <IconButton
        color="inherit"
        aria-label={activeScreen === 'settings' ? 'Back to studio' : 'Open settings'}
        onClick={onToggleSettingsScreen}
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255,255,255,0.04)'
        }}
      >
        {activeScreen === 'settings' ? <ArrowBackRoundedIcon /> : <SettingsRoundedIcon />}
      </IconButton>

      <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', xl: 'flex-start' }}>
        <Stack spacing={0.75} sx={{ maxWidth: 680 }}>
          <Typography className="app-section-label">Creative Performance Suite</Typography>
          <Typography variant="h3" sx={{ maxWidth: 580, fontSize: { xs: '1.9rem', md: '2.3rem', xl: '2.5rem' }, lineHeight: 1 }}>
            Gesture-controlled audio, staged like a real instrument.
          </Typography>
        </Stack>

        <Box className={`hero-command-bar ${inputsActive ? 'is-live' : ''} ${recordingActive ? 'is-recording' : ''}`}>
          <Box className="hero-command-group hero-command-group--transport">
            <Typography component="span" className="hero-command-label">Session</Typography>
            <Button
              variant="contained"
              className="hero-command-button is-primary"
              onClick={() => void onStartSources()}
              disabled={inputsActive}
            >
              {inputsActive ? 'Inputs Live' : 'Power Up Studio'}
            </Button>
            <Button
              variant="text"
              color="inherit"
              className="hero-command-button"
              onClick={() => void onStopSources()}
              disabled={!inputsActive}
            >
              {inputsActive ? 'Reset Session' : 'Studio Idle'}
            </Button>
          </Box>

          <Box className="hero-command-divider" />

          <Box className="hero-command-group hero-command-group--status">
            <Box className={`hero-status-item ${audioInitialized ? 'is-active' : ''}`}>
              <Box className="hero-status-dot" />
              <Typography component="span" className="hero-status-label">Audio</Typography>
              <Typography component="span" className="hero-status-value">
                {audioInitialized ? 'Armed' : 'Idle'}
              </Typography>
            </Box>

            <Box className={`hero-status-item ${isCameraActive ? 'is-active' : ''}`}>
              <Box className="hero-status-dot" />
              <Typography component="span" className="hero-status-label">Vision</Typography>
              <Typography component="span" className="hero-status-value">
                {isCameraActive ? 'Live' : 'Idle'}
              </Typography>
            </Box>

            <Box className={`hero-status-item ${recordingActive ? 'is-recording' : ''}`}>
              <Box className="hero-status-dot" />
              <Typography component="span" className="hero-status-label">Capture</Typography>
              <Typography component="span" className="hero-status-value">
                {recordingActive ? 'Recording' : 'Standby'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Stack>

      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', lg: 'center' }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, fontSize: '0.9rem' }}>
          Keep the live stage in view, arm the session quickly, and open deeper routing or effect controls only when you need them.
        </Typography>
      </Stack>
    </Stack>
  );
};