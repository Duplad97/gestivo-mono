import { useEffect, useRef, useState, type ReactElement, type RefObject } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import FrontHandRoundedIcon from '@mui/icons-material/FrontHandRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { CameraPreview } from '../../features/camera/CameraPreview';
import { CameraStage } from '../../features/camera/CameraStage';
import { GestureOverlay } from '../../features/gestures/GestureOverlay';
import type { GestureFrame } from '../../features/gestures/GestureDetector';
import {
  GESTURE_ACTIONS,
  GESTURE_NAMES,
  GESTURE_TRIGGER_MODES,
  type GestureAction,
  type GestureMappingRule,
  type GestureName,
  type GestureTriggerMode
} from '../../features/gestures/types';

type StageState = {
  icon: ReactElement;
  title: string;
  description: string;
  tone: 'idle' | 'warming' | 'error';
} | null;

type StudioDashboardProps = {
  panelSx: SxProps<Theme>;
  fieldSx: SxProps<Theme>;
  videoRef: RefObject<HTMLVideoElement | null>;
  cameraStream: MediaStream | null;
  gestureFrame: GestureFrame | null;
  stageState: StageState;
  requiredDeviceMessage: string | null;
  lastGestureLabel: string | null;
  currentGestureConfidence: string;
  liveStatus: string;
  inputsActive: boolean;
  debugOverlayEnabled: boolean;
  sessionPanelTone: string;
  recordingActive: boolean;
  systemTone: string;
  currentGestureLabel: string;
  modeTileIcon: ReactElement;
  recordingMode: 'audio' | 'video';
  gestureRouterSummary: string;
  gestureMappingWarnings: string[];
  gestureMappings: GestureMappingRule[];
  gestureLabels: Record<GestureName, string>;
  actionLabels: Record<GestureAction, string>;
  triggerModeLabels: Record<GestureTriggerMode, string>;
  effectDeckSummary: string;
  lowPassFrequency: number;
  highPassFrequency: number;
  outputGain: number;
  onStartSources: () => Promise<void>;
  onStopSources: () => Promise<void>;
  onStartRecording: () => Promise<void>;
  onStopRecording: () => Promise<void>;
  onSetLowPassFrequency: (value: number) => void;
  onSetHighPassFrequency: (value: number) => void;
  onSetOutputGain: (value: number) => void;
  onSetGestureMapping: (index: number, mapping: GestureMappingRule) => void;
  onAddGestureMapping: () => void;
  onRemoveGestureMapping: (index: number) => void;
};

export const StudioDashboard = ({
  panelSx,
  fieldSx,
  videoRef,
  cameraStream,
  gestureFrame,
  stageState,
  requiredDeviceMessage,
  lastGestureLabel,
  currentGestureConfidence,
  liveStatus,
  inputsActive,
  debugOverlayEnabled,
  sessionPanelTone,
  recordingActive,
  systemTone,
  currentGestureLabel,
  modeTileIcon,
  recordingMode,
  gestureRouterSummary,
  gestureMappingWarnings,
  gestureMappings,
  gestureLabels,
  actionLabels,
  triggerModeLabels,
  effectDeckSummary,
  lowPassFrequency,
  highPassFrequency,
  outputGain,
  onStartSources,
  onStopSources,
  onStartRecording,
  onStopRecording,
  onSetLowPassFrequency,
  onSetHighPassFrequency,
  onSetOutputGain,
  onSetGestureMapping,
  onAddGestureMapping,
  onRemoveGestureMapping
}: StudioDashboardProps): ReactElement => {
  const [activeSidebarPanel, setActiveSidebarPanel] = useState<'shortcuts' | 'sound'>('shortcuts');
  const [controlsDialogOpen, setControlsDialogOpen] = useState(false);
  const [cameraUiHidden, setCameraUiHidden] = useState(false);
  const [isFallbackFullscreen, setIsFallbackFullscreen] = useState(false);
  const cameraShellRef = useRef<HTMLDivElement | null>(null);

  const toggleStageFullscreen = (): void => {
    setIsFallbackFullscreen((currentValue) => !currentValue);
  };

  useEffect(() => {
    if (!isFallbackFullscreen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsFallbackFullscreen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFallbackFullscreen]);

  useEffect(() => {
    document.body.classList.toggle('camera-fallback-fullscreen-active', isFallbackFullscreen);

    return () => {
      document.body.classList.remove('camera-fallback-fullscreen-active');
    };
  }, [isFallbackFullscreen]);

  const isImmersiveCameraMode = isFallbackFullscreen;

  return (
    <Box className="dashboard-grid">
      <Box className="stage-stack">
        <Paper className="glass-panel" elevation={0} sx={{ p: 0, borderRadius: '28px' }}>
          <Box ref={cameraShellRef} className={`camera-shell ${isFallbackFullscreen ? 'is-stage-fullscreen' : ''}`}>
            {!cameraUiHidden ? (
              <Box className="stage-chrome">
                <Box className={`stage-pill ${inputsActive ? 'is-active' : ''}`}>
                  <SensorsRoundedIcon fontSize="small" />
                  <span className="stage-pill-label">Stage</span>
                  <span className="stage-pill-value">{liveStatus}</span>
                </Box>
                <Box className={`stage-pill ${lastGestureLabel ? 'is-active' : ''}`}>
                  <FrontHandRoundedIcon fontSize="small" />
                  <span className="stage-pill-label">Tracking</span>
                  <span className="stage-pill-value">{currentGestureConfidence}</span>
                </Box>
                <Box className={`stage-pill ${debugOverlayEnabled ? 'is-active' : ''}`}>
                  <VisibilityRoundedIcon fontSize="small" />
                  <span className="stage-pill-label">Overlay</span>
                  <span className="stage-pill-value">{debugOverlayEnabled ? 'Visible' : 'Hidden'}</span>
                </Box>
              </Box>
            ) : null}

            <IconButton
              className="stage-ui-toggle"
              color="inherit"
              aria-label={cameraUiHidden ? 'Show camera UI' : 'Hide camera UI'}
              onClick={() => setCameraUiHidden((currentValue) => !currentValue)}
            >
              {cameraUiHidden ? <VisibilityRoundedIcon /> : <VisibilityOffRoundedIcon />}
            </IconButton>

            <IconButton
              className="stage-fullscreen-toggle"
              color="inherit"
              aria-label={isImmersiveCameraMode ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={toggleStageFullscreen}
            >
              {isImmersiveCameraMode ? <FullscreenExitRoundedIcon /> : <FullscreenRoundedIcon />}
            </IconButton>

            {isImmersiveCameraMode ? (
              <Box className="stage-fullscreen-controls">
                <Tooltip title={inputsActive ? 'Reset inputs' : 'Start inputs'}>
                  <IconButton
                    className="stage-fullscreen-action"
                    color="inherit"
                    aria-label={inputsActive ? 'Reset inputs' : 'Start inputs'}
                    onClick={() => void (inputsActive ? onStopSources() : onStartSources())}
                  >
                    {inputsActive ? <RestartAltRoundedIcon /> : <SensorsRoundedIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={recordingActive ? 'Recording active' : 'Start recording'}>
                  <span>
                    <IconButton
                      className="stage-fullscreen-action is-record"
                      color="inherit"
                      aria-label="Start recording"
                      onClick={() => void onStartRecording()}
                      disabled={recordingActive}
                    >
                      <FiberManualRecordRoundedIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ) : null}

            <CameraStage>
              <CameraPreview stream={cameraStream} videoRef={videoRef} />
              {!cameraUiHidden && stageState?.tone === 'error' ? (
                <Box className={`stage-state-card is-${stageState.tone}`}>
                  <Box className="stage-state-icon">{stageState.icon}</Box>
                  <Typography variant="h6">{stageState.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stageState.description}
                  </Typography>
                </Box>
              ) : null}
              {debugOverlayEnabled && !cameraUiHidden ? <GestureOverlay frame={gestureFrame} videoRef={videoRef} /> : null}
            </CameraStage>
          </Box>
        </Paper>
      </Box>

      <Box className="sidebar-stack">
        <Paper className={`glass-panel session-panel ${sessionPanelTone}`} elevation={0} sx={panelSx}>
          <Stack spacing={2}>
            <Box className="session-panel-header">
              <Typography className="app-section-label">Session Control</Typography>
              <Typography variant="h5" sx={{ mt: 0.75 }}>Studio transport</Typography>
              <Box className={`session-panel-status ${sessionPanelTone}`}>
                <span className="session-panel-status-dot" />
                <span>{recordingActive ? 'Recording live' : inputsActive ? 'Inputs armed' : 'Studio idle'}</span>
              </Box>
              {requiredDeviceMessage ? <Alert severity="warning">{requiredDeviceMessage}</Alert> : null}
            </Box>

            <Box className="quick-status-grid">
              <Box className={`metric-tile compact-metric-tile ${inputsActive ? 'metric-tile-active' : ''}`}>
                <MemoryRoundedIcon className="metric-icon" fontSize="small" />
                <span className="metric-kicker">System</span>
                <div className="metric-value">{systemTone}</div>
              </Box>
              <Box className={`metric-tile compact-metric-tile ${lastGestureLabel ? 'metric-tile-active' : ''}`}>
                <FrontHandRoundedIcon className="metric-icon" fontSize="small" />
                <span className="metric-kicker">Gesture</span>
                <div className="metric-value">{currentGestureLabel}</div>
              </Box>
              <Box className="metric-tile compact-metric-tile">
                {modeTileIcon}
                <span className="metric-kicker">Mode</span>
                <div className="metric-value">{recordingMode === 'video' ? 'AV' : 'Audio'}</div>
              </Box>
            </Box>

            <Box className="session-command-grid">
              <Button variant="contained" fullWidth onClick={() => void onStartSources()} disabled={inputsActive} startIcon={<SensorsRoundedIcon />}>
                {inputsActive ? 'Inputs Live' : 'Start Inputs'}
              </Button>
              {!recordingActive ? (
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  onClick={() => void onStartRecording()}
                  startIcon={<FiberManualRecordRoundedIcon sx={{ color: '#ff4d4f' }} />}
                >
                  Start Recording
                </Button>
              ) : (
                <Button variant="contained" color="error" fullWidth onClick={() => void onStopRecording()} startIcon={<SaveRoundedIcon />}>
                  Stop and Save
                </Button>
              )}
            </Box>
            <Box className="session-detail-grid">
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={() => void onStopSources()}
                disabled={!inputsActive}
                startIcon={<RestartAltRoundedIcon />}
                sx={{ gridColumn: '1 / -1' }}
              >
                Reset Inputs
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                onClick={() => setControlsDialogOpen(true)}
                startIcon={<TuneRoundedIcon />}
                sx={{ gridColumn: '1 / -1' }}
              >
                Open Controls
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Dialog
        open={controlsDialogOpen}
        onClose={() => setControlsDialogOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          className: 'control-dialog-paper'
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
            <Box className="accordion-heading">
              {activeSidebarPanel === 'shortcuts' ? <HubRoundedIcon fontSize="small" className="accordion-heading-icon" /> : <TuneRoundedIcon fontSize="small" className="accordion-heading-icon" />}
              <Box>
                <Typography className="app-section-label">Control Hub</Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  {activeSidebarPanel === 'shortcuts' ? 'Gesture shortcuts' : 'Sound controls'}
                </Typography>
                <Typography variant="caption" color="text.secondary" className="accordion-summary-copy">
                  {activeSidebarPanel === 'shortcuts' ? gestureRouterSummary : effectDeckSummary}
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={activeSidebarPanel === 'shortcuts' ? `${gestureMappings.length} shortcuts` : `${outputGain.toFixed(2)}x output`} />
              <IconButton color="inherit" onClick={() => setControlsDialogOpen(false)} aria-label="Close controls dialog">
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          <Stack spacing={2.25}>
            <Tabs
              value={activeSidebarPanel}
              onChange={(_event, value: 'shortcuts' | 'sound') => setActiveSidebarPanel(value)}
              className="control-hub-tabs"
              variant="fullWidth"
            >
              <Tab value="shortcuts" label="Gesture Shortcuts" />
              <Tab value="sound" label="Sound Controls" />
            </Tabs>

            {activeSidebarPanel === 'shortcuts' ? (
              <Stack spacing={2} className="control-hub-panel">
                {gestureMappingWarnings.length > 0 ? <Alert severity="warning">{gestureMappingWarnings.join(' ')}</Alert> : null}
                <Typography variant="body2" color="text.secondary">
                  Pick a hand gesture, choose what it should change, then decide whether it should react continuously or only once when detected.
                </Typography>

                <Box className="mapping-grid">
                  {gestureMappings.map((mapping, index) => (
                    <Box key={`${index}-${mapping.gesture}-${mapping.action}-${mapping.triggerMode}`} className="mapping-card">
                      <Stack spacing={1.2}>
                        <Box className="mapping-card-header">
                          <Box>
                            <Typography className="app-section-label mapping-title-row"><PlayArrowRoundedIcon fontSize="inherit" /> Shortcut {String(index + 1).padStart(2, '0')}</Typography>
                            <Box className="mapping-route-line">
                              <span className="mapping-route-token">{gestureLabels[mapping.gesture]}</span>
                              <span className="mapping-route-arrow">changes</span>
                              <span className="mapping-route-token">{actionLabels[mapping.action]}</span>
                              <span className="mapping-route-arrow">using</span>
                              <span className={`mapping-route-token ${mapping.triggerMode === 'edge' ? 'is-edge' : ''}`}>{triggerModeLabels[mapping.triggerMode]}</span>
                            </Box>
                          </Box>
                          <Box className={`mapping-trigger-badge ${mapping.triggerMode === 'edge' ? 'is-edge' : ''}`}>
                            {triggerModeLabels[mapping.triggerMode]}
                          </Box>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <FormControl fullWidth sx={fieldSx}>
                            <InputLabel id={`gesture-select-${index}`}>Hand Gesture</InputLabel>
                            <Select
                              labelId={`gesture-select-${index}`}
                              label="Hand Gesture"
                              value={mapping.gesture}
                              onChange={(event) =>
                                onSetGestureMapping(index, {
                                  ...mapping,
                                  gesture: event.target.value as GestureName
                                })
                              }
                            >
                              {GESTURE_NAMES.map((gestureName) => (
                                <MenuItem key={gestureName} value={gestureName}>
                                  {gestureLabels[gestureName]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <FormControl fullWidth sx={fieldSx}>
                            <InputLabel id={`action-select-${index}`}>What It Changes</InputLabel>
                            <Select
                              labelId={`action-select-${index}`}
                              label="What It Changes"
                              value={mapping.action}
                              onChange={(event) =>
                                onSetGestureMapping(index, {
                                  ...mapping,
                                  action: event.target.value as GestureAction,
                                  triggerMode: event.target.value === 'toggleLowPassFocus' ? 'edge' : mapping.triggerMode
                                })
                              }
                            >
                              {GESTURE_ACTIONS.map((actionName) => (
                                <MenuItem key={actionName} value={actionName}>
                                  {actionLabels[actionName]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                          <FormControl fullWidth sx={fieldSx}>
                            <InputLabel id={`trigger-mode-select-${index}`}>Reaction Style</InputLabel>
                            <Select
                              labelId={`trigger-mode-select-${index}`}
                              label="Reaction Style"
                              value={mapping.triggerMode}
                              onChange={(event) =>
                                onSetGestureMapping(index, {
                                  ...mapping,
                                  triggerMode: event.target.value as GestureTriggerMode
                                })
                              }
                            >
                              {GESTURE_TRIGGER_MODES.map((triggerMode) => (
                                <MenuItem key={triggerMode} value={triggerMode}>
                                  {triggerModeLabels[triggerMode]}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          <Button variant="outlined" color="inherit" onClick={() => onRemoveGestureMapping(index)} sx={{ minWidth: { sm: 124 } }} startIcon={<RestartAltRoundedIcon />}>
                            Remove
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}

                  <Button variant="outlined" color="inherit" onClick={onAddGestureMapping} startIcon={<AutoAwesomeRoundedIcon />}>
                    Add Shortcut
                  </Button>
                </Box>
              </Stack>
            ) : (
              <Stack spacing={2} className="control-hub-panel">
                <Alert severity="success">
                  {lastGestureLabel
                    ? `${lastGestureLabel} is currently changing the sound with ${currentGestureConfidence} confidence.`
                    : 'These sound controls will react as soon as a tracked gesture is recognized.'}
                </Alert>

                <Typography variant="body2" color="text.secondary">
                  Think of these as simple sound-shaping controls: brightness, low-end cleanup, and overall volume.
                </Typography>

                <Box className="effect-card">
                  <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><AutoAwesomeRoundedIcon fontSize="inherit" /> Brightness</Typography>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Brightness Filter</Typography>
                    <Typography variant="body2" color="text.secondary">{Math.round(lowPassFrequency)} Hz</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                    Lower values sound softer and more muffled. Higher values sound brighter and more open.
                  </Typography>
                  <Slider min={100} max={20000} value={lowPassFrequency} onChange={(_event, value) => onSetLowPassFrequency(value as number)} />
                </Box>

                <Box className="effect-card">
                  <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><TuneRoundedIcon fontSize="inherit" /> Low-End Cleanup</Typography>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Rumble Filter</Typography>
                    <Typography variant="body2" color="text.secondary">{Math.round(highPassFrequency)} Hz</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                    Raise this to remove rumble and handling noise. Lower it to keep more bass and body.
                  </Typography>
                  <Slider min={20} max={5000} value={highPassFrequency} onChange={(_event, value) => onSetHighPassFrequency(value as number)} />
                </Box>

                <Box className="effect-card">
                  <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><VolumeUpRoundedIcon fontSize="inherit" /> Volume</Typography>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2">Output Volume</Typography>
                    <Typography variant="body2" color="text.secondary">{outputGain.toFixed(2)}x</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.25 }}>
                    Controls how loud the processed audio feels overall.
                  </Typography>
                  <Slider min={0} max={2} step={0.01} value={outputGain} onChange={(_event, value) => onSetOutputGain(value as number)} />
                </Box>
              </Stack>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};