import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';
import FrontHandRoundedIcon from '@mui/icons-material/FrontHandRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  Typography
} from '@mui/material';
import { AudioEngine } from '../features/audio/AudioEngine';
import { CameraPreview } from '../features/camera/CameraPreview';
import { CameraStage } from '../features/camera/CameraStage';
import { useCameraStream } from '../features/camera/useCameraStream';
import { ShaderBackdrop } from '../components/ShaderBackdrop';
import { GestureDetector, type GestureFrame } from '../features/gestures/GestureDetector';
import { GestureOverlay } from '../features/gestures/GestureOverlay';
import { mapGestureToActions } from '../features/gestures/GestureMapper';
import { getGestureMappingWarnings } from '../features/gestures/getGestureMappingWarnings';
import {
  GESTURE_ACTIONS,
  GESTURE_NAMES,
  GESTURE_TRIGGER_MODES,
  type GestureAction,
  type GestureEvent,
  type GestureName
} from '../features/gestures/types';
import type { GestureTriggerMode } from '../features/gestures/types';
import { RecordingController } from '../features/recording/RecordingController';
import type { RecordingMode, ThemeMode } from '../features/settings/types';
import { getPersistedAppPreferences, useAppStore } from '../stores/appStore';
import { downloadBlob } from '../utils/file';

const nowFileName = (mode: RecordingMode): string => {
  const date = new Date();
  const iso = date.toISOString().replace(/[:.]/g, '-');
  const suffix = mode === 'video' ? 'webm' : 'webm';
  return `gestivo-${mode}-${iso}.${suffix}`;
};

const panelSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: '24px'
} as const;

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
    '& fieldset': {
      borderColor: 'rgba(255,255,255,0.1)'
    },
    '&:hover fieldset': {
      borderColor: 'rgba(127,240,210,0.28)'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#7ff0d2'
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(226,232,255,0.62)'
  }
} as const;

export const App = (): ReactElement => {
  const discreteGestureCooldownMs = 900;
  const gestureLabels: Record<GestureName, string> = {
    fist: 'Fist',
    open_hand: 'Open Hand',
    pinch: 'Pinch',
    thumbs_up: 'Thumbs Up'
  };
  const actionLabels: Record<GestureAction, string> = {
    setLowPassFrequency: 'Set Low-pass Frequency',
    setOutputGain: 'Set Output Gain',
    toggleLowPassFocus: 'Toggle Low-pass Focus'
  };
  const triggerModeLabels: Record<GestureTriggerMode, string> = {
    continuous: 'Continuous',
    edge: 'Edge Triggered'
  };
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [activeScreen, setActiveScreen] = useState<'studio' | 'settings'>('studio');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const [gestureError, setGestureError] = useState<string | null>(null);
  const [gestureFrame, setGestureFrame] = useState<GestureFrame | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const recorderRef = useRef<RecordingController>(new RecordingController());
  const gestureDetectorRef = useRef<GestureDetector>(new GestureDetector());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lowPassFocusEnabledRef = useRef(false);
  const lastDiscreteGestureRef = useRef<{ gesture: string; action: string; timestamp: number } | null>(null);

  const {
    stream: cameraStream,
    start: startCamera,
    stop: stopCamera,
    error: cameraError,
    isActive: isCameraActive
  } = useCameraStream();

  const lowPassFrequency = useAppStore((state) => state.lowPassFrequency);
  const highPassFrequency = useAppStore((state) => state.highPassFrequency);
  const outputGain = useAppStore((state) => state.outputGain);
  const recordingActive = useAppStore((state) => state.recordingActive);
  const settings = useAppStore((state) => state.settings);
  const gestureMappings = useAppStore((state) => state.gestureMappings);
  const setLowPassFrequency = useAppStore((state) => state.setLowPassFrequency);
  const setHighPassFrequency = useAppStore((state) => state.setHighPassFrequency);
  const setOutputGain = useAppStore((state) => state.setOutputGain);
  const setRecordingActive = useAppStore((state) => state.setRecordingActive);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setRecordingMode = useAppStore((state) => state.setRecordingMode);
  const setGestureDebugOverlayEnabled = useAppStore((state) => state.setGestureDebugOverlayEnabled);
  const setGestureMapping = useAppStore((state) => state.setGestureMapping);
  const addGestureMapping = useAppStore((state) => state.addGestureMapping);
  const removeGestureMapping = useAppStore((state) => state.removeGestureMapping);
  const hydratePreferences = useAppStore((state) => state.hydratePreferences);

  const audioState = useMemo(() => audioEngineRef.current.getState(), [micStream]);
  const gestureMappingWarnings = useMemo(() => getGestureMappingWarnings(gestureMappings), [gestureMappings]);
  const currentGestureLabel = lastGesture ? gestureLabels[lastGesture.gesture] : 'Awaiting input';
  const currentGestureConfidence = lastGesture ? `${Math.round(lastGesture.confidence * 100)}%` : 'No hand';
  const inputsActive = isCameraActive || audioState.initialized;
  const liveStatus = recordingActive ? 'Recording' : isCameraActive || audioState.initialized ? 'Ready' : 'Standby';
  const systemTone = recordingActive ? 'Hot' : isCameraActive && audioState.initialized ? 'Live' : 'Idle';
  const sessionPanelTone = recordingActive ? 'is-recording' : inputsActive ? 'is-live' : 'is-idle';
  const modeTileIcon = settings.recordingMode === 'video' ? <VideocamRoundedIcon className="metric-icon" fontSize="small" /> : <GraphicEqRoundedIcon className="metric-icon" fontSize="small" />;
  const edgeRouteCount = gestureMappings.filter((mapping) => mapping.triggerMode === 'edge').length;
  const gestureRouterSummary = `${gestureMappings.length} routes • ${edgeRouteCount} edge • ${gestureMappings.length - edgeRouteCount} continuous`;
  const effectDeckSummary = `LP ${Math.round(lowPassFrequency)} Hz • HP ${Math.round(highPassFrequency)} Hz • ${outputGain.toFixed(2)}x`;
  const shouldShowStatusAlert = statusMessage !== 'Ready';
  const themeModeOptions: Array<{ value: ThemeMode; label: string; icon: ReactElement }> = [
    { value: 'system', label: 'System', icon: <DesktopWindowsRoundedIcon fontSize="small" /> },
    { value: 'dark', label: 'Dark', icon: <DarkModeRoundedIcon fontSize="small" /> },
    { value: 'light', label: 'Light', icon: <LightModeRoundedIcon fontSize="small" /> }
  ];
  const recordingModeOptions: Array<{ value: RecordingMode; label: string; description: string; icon: ReactElement }> = [
    { value: 'audio', label: 'Audio Only', description: 'Capture the processed audio chain only.', icon: <GraphicEqRoundedIcon fontSize="small" /> },
    { value: 'video', label: 'Video + Audio', description: 'Capture camera video together with processed audio.', icon: <VideocamRoundedIcon fontSize="small" /> }
  ];
  const stageState = cameraError
    ? {
        icon: <WarningAmberRoundedIcon fontSize="small" />,
        title: 'Camera feed unavailable',
        description: cameraError,
        tone: 'error'
      }
    : cameraStream
      ? null
      : inputsActive
        ? {
            icon: <HourglassTopRoundedIcon fontSize="small" />,
            title: 'Waiting for visual stage',
            description: 'Audio is armed. Bring the camera online to restore the live preview and gesture tracking.',
            tone: 'warming'
          }
        : {
            icon: <VideocamRoundedIcon fontSize="small" />,
            title: 'Camera stage on standby',
            description: 'Start inputs to open the live preview and begin hand tracking.',
            tone: 'idle'
          };

  const startAudio = async (): Promise<MediaStream> => {
    if (micStream) {
      return micStream;
    }

    const nextStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });

    setMicStream(nextStream);
    await audioEngineRef.current.initialize(nextStream);
    setStatusMessage('Audio chain started');

    return nextStream;
  };

  const applyGestureEvent = (event: GestureEvent): void => {
    setLastGesture(event);

    const actions = mapGestureToActions(event, gestureMappings);

    if (actions.length === 0) {
      return;
    }

    actions.forEach((action) => {
      if (action.triggerMode === 'edge') {
        const lastDiscreteGesture = lastDiscreteGestureRef.current;

        if (
          lastDiscreteGesture &&
          lastDiscreteGesture.gesture === event.gesture &&
          lastDiscreteGesture.action === action.action &&
          event.timestamp - lastDiscreteGesture.timestamp < discreteGestureCooldownMs
        ) {
          return;
        }

        lastDiscreteGestureRef.current = {
          gesture: event.gesture,
          action: action.action,
          timestamp: event.timestamp
        };
      }

      if (action.action === 'setLowPassFrequency' && action.value !== undefined) {
        setLowPassFrequency(action.value);
        return;
      }

      if (action.action === 'setOutputGain' && action.value !== undefined) {
        setOutputGain(action.value);
        return;
      }

      if (action.action === 'toggleLowPassFocus') {
        lowPassFocusEnabledRef.current = !lowPassFocusEnabledRef.current;
        setLowPassFrequency(lowPassFocusEnabledRef.current ? 1800 : 12000);
      }
    });
  };

  const startSources = async (): Promise<void> => {
    try {
      await Promise.all([startAudio(), startCamera()]);
      setStatusMessage('Camera and microphone are live');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start media sources';
      setStatusMessage(message);
    }
  };

  const stopSources = async (): Promise<void> => {
    stopCamera();
    micStream?.getTracks().forEach((track) => track.stop());
    setMicStream(null);
    lastDiscreteGestureRef.current = null;
    await audioEngineRef.current.dispose();
    setStatusMessage('Media sources stopped');
  };

  const startRecording = async (): Promise<void> => {
    try {
      await startAudio();

      if (settings.recordingMode === 'video' && !cameraStream) {
        await startCamera();
      }

      const processedAudio = audioEngineRef.current.getProcessedAudioStream();
      const videoTrack = cameraStream?.getVideoTracks()[0];

      recorderRef.current.start({
        mode: settings.recordingMode,
        videoTrack,
        audioStream: processedAudio
      });

      setRecordingActive(true);
      setStatusMessage('Recording started');
    } catch {
      setStatusMessage('Unable to start recording');
      setRecordingActive(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    try {
      const blob = await recorderRef.current.stop();
      await downloadBlob(blob, nowFileName(settings.recordingMode));
      setStatusMessage('Recording saved successfully');
    } catch {
      setStatusMessage('Recording stopped, but save failed');
    } finally {
      setRecordingActive(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async (): Promise<void> => {
      try {
        const preferences = await window.gestivo.loadPreferences();

        if (!cancelled && preferences) {
          hydratePreferences(preferences);
        }
      } catch {
        if (!cancelled) {
          setStatusMessage('Could not load saved preferences');
        }
      } finally {
        if (!cancelled) {
          setPreferencesLoaded(true);
        }
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, [hydratePreferences]);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const preferences = getPersistedAppPreferences({
      settings,
      gestureMappings
    });

    void window.gestivo.savePreferences(preferences);
  }, [gestureMappings, preferencesLoaded, settings]);

  useEffect(() => {
    audioEngineRef.current.setLowPassFrequency(lowPassFrequency);
  }, [lowPassFrequency]);

  useEffect(() => {
    audioEngineRef.current.setHighPassFrequency(highPassFrequency);
  }, [highPassFrequency]);

  useEffect(() => {
    audioEngineRef.current.setOutputGain(outputGain);
  }, [outputGain]);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!cameraStream || !videoElement) {
      gestureDetectorRef.current.stop();
      lastDiscreteGestureRef.current = null;
      setGestureFrame(null);
      return;
    }

    let cancelled = false;

    const startDetection = async (): Promise<void> => {
      try {
        await gestureDetectorRef.current.start(videoElement, (event) => {
          if (!cancelled) {
            applyGestureEvent(event);
          }
        }, (frame) => {
          if (!cancelled) {
            setGestureFrame(frame);
          }
        });
        setGestureError(null);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Gesture detection failed to initialize';
          setGestureError(message);
        }
      }
    };

    void startDetection();

    return () => {
      cancelled = true;
      lastDiscreteGestureRef.current = null;
      setGestureFrame(null);
      gestureDetectorRef.current.stop();
    };
  }, [cameraStream, gestureMappings]);

  useEffect(() => {
    return () => {
      stopCamera();
      micStream?.getTracks().forEach((track) => track.stop());
      gestureDetectorRef.current.dispose();
      void audioEngineRef.current.dispose();
    };
  }, [micStream, stopCamera]);

  return (
    <Box className="app-shell">
      <ShaderBackdrop />
      <Container maxWidth="xl">
        <Paper className="glass-panel app-frame" elevation={0} sx={{ p: { xs: 1.5, md: 2.25, xl: 2.5 }, borderRadius: '32px' }}>
          <Stack spacing={2}>
            <Stack spacing={1.25} sx={{ position: 'relative', pr: { xs: 7, md: 8 } }}>
              <IconButton
                color="inherit"
                aria-label={activeScreen === 'settings' ? 'Back to studio' : 'Open settings'}
                onClick={() => setActiveScreen((currentScreen) => (currentScreen === 'settings' ? 'studio' : 'settings'))}
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
                      onClick={() => void startSources()}
                      disabled={inputsActive}
                    >
                      {inputsActive ? 'Inputs Live' : 'Power Up Studio'}
                    </Button>
                    <Button
                      variant="text"
                      color="inherit"
                      className="hero-command-button"
                      onClick={() => void stopSources()}
                      disabled={!inputsActive}
                    >
                      {inputsActive ? 'Reset Session' : 'Studio Idle'}
                    </Button>
                  </Box>

                  <Box className="hero-command-divider" />

                  <Box className="hero-command-group hero-command-group--status">
                    <Box className={`hero-status-item ${audioState.initialized ? 'is-active' : ''}`}>
                      <Box className="hero-status-dot" />
                      <Typography component="span" className="hero-status-label">Audio</Typography>
                      <Typography component="span" className="hero-status-value">
                        {audioState.initialized ? 'Armed' : 'Idle'}
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

            {activeScreen === 'settings' ? (
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
                            onClick={() => setThemeMode(option.value)}
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
                            onClick={() => setRecordingMode(option.value)}
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
                          onChange={(_event, checked) => setGestureDebugOverlayEnabled(checked)}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </Box>
            ) : (
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
                        {lastGesture ? `${gestureLabels[lastGesture.gesture]} detected` : 'Awaiting hand input'}
                      </Typography>
                    </Box>

                    <Box className="stage-chrome">
                      <Box className={`stage-pill ${inputsActive ? 'is-active' : ''}`}>
                        <SensorsRoundedIcon fontSize="small" />
                        <span className="stage-pill-label">Stage</span>
                        <span className="stage-pill-value">{liveStatus}</span>
                      </Box>
                      <Box className={`stage-pill ${lastGesture ? 'is-active' : ''}`}>
                        <FrontHandRoundedIcon fontSize="small" />
                        <span className="stage-pill-label">Tracking</span>
                        <span className="stage-pill-value">{currentGestureConfidence}</span>
                      </Box>
                      <Box className={`stage-pill ${settings.enableGestureDebugOverlay ? 'is-active' : ''}`}>
                        <VisibilityRoundedIcon fontSize="small" />
                        <span className="stage-pill-label">Overlay</span>
                        <span className="stage-pill-value">{settings.enableGestureDebugOverlay ? 'Visible' : 'Hidden'}</span>
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
                      {settings.enableGestureDebugOverlay ? <GestureOverlay frame={gestureFrame} videoRef={videoRef} /> : null}
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
                      <Box className={`metric-tile compact-metric-tile ${lastGesture ? 'metric-tile-active' : ''}`}>
                        <FrontHandRoundedIcon className="metric-icon" fontSize="small" />
                        <span className="metric-kicker">Gesture</span>
                        <div className="metric-value">{currentGestureLabel}</div>
                      </Box>
                      <Box className="metric-tile compact-metric-tile">
                        {modeTileIcon}
                        <span className="metric-kicker">Mode</span>
                        <div className="metric-value">{settings.recordingMode === 'video' ? 'AV' : 'Audio'}</div>
                      </Box>
                    </Box>

                    <Box className="session-command-grid">
                      <Button variant="contained" fullWidth onClick={() => void startSources()} disabled={inputsActive} startIcon={<SensorsRoundedIcon />}>
                        {inputsActive ? 'Inputs Live' : 'Start Inputs'}
                      </Button>
                      {!recordingActive ? (
                        <Button variant="contained" color="secondary" fullWidth onClick={() => void startRecording()} startIcon={<FiberManualRecordRoundedIcon />}>
                          Start Recording
                        </Button>
                      ) : (
                        <Button variant="contained" color="error" fullWidth onClick={() => void stopRecording()} startIcon={<SaveRoundedIcon />}>
                          Stop and Save
                        </Button>
                      )}
                    </Box>
                    <Box className="session-detail-grid">
                      <Button
                        variant="outlined"
                        color="inherit"
                        fullWidth
                        onClick={() => void stopSources()}
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
                                      setGestureMapping(index, {
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
                                      setGestureMapping(index, {
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
                                      setGestureMapping(index, {
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

                                <Button variant="outlined" color="inherit" onClick={() => removeGestureMapping(index)} sx={{ minWidth: { sm: 124 } }} startIcon={<RestartAltRoundedIcon />}>
                                  Remove
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        ))}

                        <Button variant="outlined" color="inherit" onClick={() => addGestureMapping()} startIcon={<AutoAwesomeRoundedIcon />}>
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
                        {lastGesture
                          ? `${gestureLabels[lastGesture.gesture]} is driving the chain with ${Math.round(lastGesture.confidence * 100)}% confidence.`
                          : 'The effect deck will react as soon as a tracked gesture is recognized.'}
                      </Alert>

                      <Box className="effect-card">
                        <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><AutoAwesomeRoundedIcon fontSize="inherit" /> Tone shaping</Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2">Low-pass Frequency</Typography>
                          <Typography variant="body2" color="text.secondary">{Math.round(lowPassFrequency)} Hz</Typography>
                        </Stack>
                        <Slider min={100} max={20000} value={lowPassFrequency} onChange={(_event, value) => setLowPassFrequency(value as number)} />
                      </Box>

                      <Box className="effect-card">
                        <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><TuneRoundedIcon fontSize="inherit" /> Clarity shaping</Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2">High-pass Frequency</Typography>
                          <Typography variant="body2" color="text.secondary">{Math.round(highPassFrequency)} Hz</Typography>
                        </Stack>
                        <Slider min={20} max={5000} value={highPassFrequency} onChange={(_event, value) => setHighPassFrequency(value as number)} />
                      </Box>

                      <Box className="effect-card">
                        <Typography className="app-section-label effect-card-label" sx={{ mb: 1 }}><VolumeUpRoundedIcon fontSize="inherit" /> Output staging</Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2">Output Gain</Typography>
                          <Typography variant="body2" color="text.secondary">{outputGain.toFixed(2)}x</Typography>
                        </Stack>
                        <Slider min={0} max={2} step={0.01} value={outputGain} onChange={(_event, value) => setOutputGain(value as number)} />
                      </Box>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Box>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
