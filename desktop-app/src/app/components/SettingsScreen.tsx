import type { ReactElement } from 'react';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { Box, Button, Paper, Stack, Switch, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { RecordingMode, ThemeMode, AppSettings } from '../../features/settings/types';

type SettingsScreenProps = {
  settings: AppSettings;
  panelSx: SxProps<Theme>;
  onSetThemeMode: (themeMode: ThemeMode) => void;
  onSetRecordingMode: (recordingMode: RecordingMode) => void;
  onSetGestureDebugOverlayEnabled: (enabled: boolean) => void;
};

const themeModeOptions: Array<{ value: ThemeMode; label: string; icon: ReactElement }> = [
  { value: 'system', label: 'System', icon: <DesktopWindowsRoundedIcon fontSize="small" /> },
  { value: 'dark', label: 'Dark', icon: <DarkModeRoundedIcon fontSize="small" /> },
  { value: 'light', label: 'Light', icon: <LightModeRoundedIcon fontSize="small" /> }
];

const recordingModeOptions: Array<{ value: RecordingMode; label: string; description: string; icon: ReactElement }> = [
  { value: 'audio', label: 'Audio Only', description: 'Capture the processed audio chain only.', icon: <GraphicEqRoundedIcon fontSize="small" /> },
  { value: 'video', label: 'Video + Audio', description: 'Capture camera video together with processed audio.', icon: <VideocamRoundedIcon fontSize="small" /> }
];

export const SettingsScreen = ({
  settings,
  panelSx,
  onSetThemeMode,
  onSetRecordingMode,
  onSetGestureDebugOverlayEnabled
}: SettingsScreenProps): ReactElement => {
  return (
    <Box className="settings-screen">
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'flex-start' }}>
        <Box sx={{ maxWidth: 620 }}>
          <Typography className="app-section-label">Preferences</Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>App settings</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 520 }}>
            Move persistent preferences out of the live control rail so the studio view stays focused on operating the session.
          </Typography>
        </Box>
      </Stack>

      <Box className="settings-grid">
        <Paper className="glass-panel settings-card" elevation={0} sx={panelSx}>
          <Stack spacing={2}>
            <Box>
              <Typography className="app-section-label">Appearance</Typography>
              <Typography variant="h6" sx={{ mt: 0.75 }}>Theme mode</Typography>
            </Box>
            <Box className="settings-choice-grid">
              {themeModeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={settings.themeMode === option.value ? 'contained' : 'outlined'}
                  color={settings.themeMode === option.value ? 'primary' : 'inherit'}
                  className="settings-choice-button"
                  startIcon={option.icon}
                  onClick={() => onSetThemeMode(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </Box>
          </Stack>
        </Paper>

        <Paper className="glass-panel settings-card" elevation={0} sx={panelSx}>
          <Stack spacing={2}>
            <Box>
              <Typography className="app-section-label">Capture</Typography>
              <Typography variant="h6" sx={{ mt: 0.75 }}>Recording default</Typography>
            </Box>
            <Box className="settings-option-stack">
              {recordingModeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={settings.recordingMode === option.value ? 'contained' : 'outlined'}
                  color={settings.recordingMode === option.value ? 'secondary' : 'inherit'}
                  className="settings-option-button"
                  startIcon={option.icon}
                  onClick={() => onSetRecordingMode(option.value)}
                >
                  <Box className="settings-option-copy">
                    <span className="settings-option-title">{option.label}</span>
                    <span className="settings-option-description">{option.description}</span>
                  </Box>
                </Button>
              ))}
            </Box>
          </Stack>
        </Paper>

        <Paper className="glass-panel settings-card" elevation={0} sx={panelSx}>
          <Stack spacing={2}>
            <Box>
              <Typography className="app-section-label">Visual Aids</Typography>
              <Typography variant="h6" sx={{ mt: 0.75 }}>Overlay helpers</Typography>
            </Box>
            <Box className="settings-toggle-row">
              <Box className="settings-toggle-copy">
                <Typography variant="body2" className="setting-title-row">
                  <VisibilityRoundedIcon fontSize="small" />
                  <span>Gesture debug overlay</span>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Show landmark guides and tracking feedback over the live camera stage.
                </Typography>
              </Box>
              <Switch
                checked={settings.enableGestureDebugOverlay}
                onChange={(_event, checked) => onSetGestureDebugOverlayEnabled(checked)}
              />
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};