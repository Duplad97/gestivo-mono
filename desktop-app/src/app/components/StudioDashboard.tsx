import type { ReactElement, RefObject } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import FrontHandRoundedIcon from '@mui/icons-material/FrontHandRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
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
  cameraError: string | null;
  gestureError: string | null;
  shouldShowStatusAlert: boolean;
  statusMessage: string;
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
  cameraError,
  gestureError,
  shouldShowStatusAlert,
  statusMessage,
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
  return (
    <Box className="dashboard-grid">
      <Box className="stage-stack">
        <Paper className="glass-panel" elevation={0} sx={{ p: 0, borderRadius: '28px' }}>
          <Box className="camera-shell">
            <Box className="stage-caption">
              <Typography className="app-section-label stage-caption-label">Live Visual Stage</Typography>
              <Typography variant="body2" className="stage-caption-title">
                Performance camera
              </Typography>
              <Typography variant="caption" color="text.secondary" className="stage-caption-copy">
                {lastGestureLabel ? `${lastGestureLabel} detected` : 'Awaiting hand input'}
              </Typography>
            </Box>

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

            <CameraStage>
              <CameraPreview stream={cameraStream} videoRef={videoRef} />
              {stageState ? (
                <Box className={`stage-state-card is-${stageState.tone}`}>
                  <Box className="stage-state-icon">{stageState.icon}</Box>
                  <Typography variant="h6">{stageState.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stageState.description}
                  </Typography>
                </Box>
              ) : null}
              {debugOverlayEnabled ? <GestureOverlay frame={gestureFrame} videoRef={videoRef} /> : null}
            </CameraStage>
          </Box>
        </Paper>

        {cameraError ? <Alert severity="error">{cameraError}</Alert> : null}
        {gestureError ? <Alert severity="warning">{gestureError}</Alert> : null}
        {shouldShowStatusAlert ? <Alert severity="info">{statusMessage}</Alert> : null}
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
                <Button variant="contained" color="secondary" fullWidth onClick={() => void onStartRecording()} startIcon={<FiberManualRecordRoundedIcon />}>
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
            </Box>
          </Stack>
        </Paper>

        <Accordion disableGutters defaultExpanded={false} className="glass-accordion">
          <AccordionSummary
            expandIcon={<Box component="span" className="accordion-icon">+</Box>}
            aria-controls="gesture-router-content"
            id="gesture-router-header"
          >
            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
              <Box className="accordion-heading">
                <HubRoundedIcon fontSize="small" className="accordion-heading-icon" />
                <Box>
                  <Typography className="app-section-label">Gesture Router</Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>Mapping matrix</Typography>
                  <Typography variant="caption" color="text.secondary" className="accordion-summary-copy">
                    {gestureRouterSummary}
                  </Typography>
                </Box>
              </Box>
              <Chip size="small" label={`${gestureMappings.length} routes`} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {gestureMappingWarnings.length > 0 ? <Alert severity="warning">{gestureMappingWarnings.join(' ')}</Alert> : null}

              <Box className="mapping-grid">
                {gestureMappings.map((mapping, index) => (
                  <Box key={`${index}-${mapping.gesture}-${mapping.action}-${mapping.triggerMode}`} className="mapping-card">
                    <Stack spacing={1.2}>
                      <Box className="mapping-card-header">
                        <Box>
                          <Typography className="app-section-label mapping-title-row"><PlayArrowRoundedIcon fontSize="inherit" /> Route {String(index + 1).padStart(2, '0')}</Typography>
                          <Box className="mapping-route-line">
                            <span className="mapping-route-token">{gestureLabels[mapping.gesture]}</span>
                            <span className="mapping-route-arrow">to</span>
                            <span className="mapping-route-token">{actionLabels[mapping.action]}</span>
                            <span className="mapping-route-arrow">via</span>
                            <span className={`mapping-route-token ${mapping.triggerMode === 'edge' ? 'is-edge' : ''}`}>{triggerModeLabels[mapping.triggerMode]}</span>
                          </Box>
                        </Box>
                        <Box className={`mapping-trigger-badge ${mapping.triggerMode === 'edge' ? 'is-edge' : ''}`}>
                          {triggerModeLabels[mapping.triggerMode]}
                        </Box>
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <FormControl fullWidth sx={fieldSx}>
                          <InputLabel id={`gesture-select-${index}`}>Gesture</InputLabel>
                          <Select
                            labelId={`gesture-select-${index}`}
                            label="Gesture"
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
                          <InputLabel id={`action-select-${index}`}>Action</InputLabel>
                          <Select
                            labelId={`action-select-${index}`}
                            label="Action"
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
                          <InputLabel id={`trigger-mode-select-${index}`}>Trigger Mode</InputLabel>
                          <Select
                            labelId={`trigger-mode-select-${index}`}
                            label="Trigger Mode"
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
                  Add Mapping
                </Button>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters defaultExpanded={false} className="glass-accordion">
          <AccordionSummary
            expandIcon={<Box component="span" className="accordion-icon">+</Box>}
            aria-controls="effect-deck-content"
            id="effect-deck-header"
          >
            <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
              <Box className="accordion-heading">
                <TuneRoundedIcon fontSize="small" className="accordion-heading-icon" />
                <Box>
                  <Typography className="app-section-label">Effect Sculpting</Typography>
                  <Typography variant="h6" sx={{ mt: 0.5 }}>Live parameter deck</Typography>
                  <Typography variant="caption" color="text.secondary" className="accordion-summary-copy">
                    {effectDeckSummary}
                  </Typography>
                </Box>
              </Box>
              <Chip size="small" label={`${outputGain.toFixed(2)}x output`} />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Alert severity="success">
                {lastGestureLabel
                  ? `${lastGestureLabel} is driving the chain with ${currentGestureConfidence} confidence.`
                  : 'The effect deck will react as soon as a tracked gesture is recognized.'}
              </Alert>

              <Box className="effect-card">
                <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><AutoAwesomeRoundedIcon fontSize="inherit" /> Tone shaping</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">Low-pass Frequency</Typography>
                  <Typography variant="body2" color="text.secondary">{Math.round(lowPassFrequency)} Hz</Typography>
                </Stack>
                <Slider min={100} max={20000} value={lowPassFrequency} onChange={(_event, value) => onSetLowPassFrequency(value as number)} />
              </Box>

              <Box className="effect-card">
                <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><TuneRoundedIcon fontSize="inherit" /> Clarity shaping</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">High-pass Frequency</Typography>
                  <Typography variant="body2" color="text.secondary">{Math.round(highPassFrequency)} Hz</Typography>
                </Stack>
                <Slider min={20} max={5000} value={highPassFrequency} onChange={(_event, value) => onSetHighPassFrequency(value as number)} />
              </Box>

              <Box className="effect-card">
                <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><VolumeUpRoundedIcon fontSize="inherit" /> Output staging</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">Output Gain</Typography>
                  <Typography variant="body2" color="text.secondary">{outputGain.toFixed(2)}x</Typography>
                </Stack>
                <Slider min={0} max={2} step={0.01} value={outputGain} onChange={(_event, value) => onSetOutputGain(value as number)} />
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};