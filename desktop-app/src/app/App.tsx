import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
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
  FormControlLabel,
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
import { getPersistedAppPreferences, useAppStore } from '../stores/appStore';
import { downloadBlob } from '../utils/file';

type RecordingMode = 'audio' | 'video';

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
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('audio');
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
  const setGestureDebugOverlayEnabled = useAppStore((state) => state.setGestureDebugOverlayEnabled);
  const setGestureMapping = useAppStore((state) => state.setGestureMapping);
  const addGestureMapping = useAppStore((state) => state.addGestureMapping);
  const removeGestureMapping = useAppStore((state) => state.removeGestureMapping);
  const hydratePreferences = useAppStore((state) => state.hydratePreferences);

  const audioState = useMemo(() => audioEngineRef.current.getState(), [micStream]);
  const gestureMappingWarnings = useMemo(() => getGestureMappingWarnings(gestureMappings), [gestureMappings]);
  const currentGestureLabel = lastGesture ? gestureLabels[lastGesture.gesture] : 'Awaiting input';
  const liveStatus = recordingActive ? 'Recording live' : isCameraActive || audioState.initialized ? 'Performance ready' : 'Standby';
  const systemTone = recordingActive ? 'Hot' : isCameraActive && audioState.initialized ? 'Live' : 'Idle';

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

      if (recordingMode === 'video' && !cameraStream) {
        await startCamera();
      }

      const processedAudio = audioEngineRef.current.getProcessedAudioStream();
      const videoTrack = cameraStream?.getVideoTracks()[0];

      recorderRef.current.start({
        mode: recordingMode,
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
      await downloadBlob(blob, nowFileName(recordingMode));
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
            <Stack spacing={1.25}>
              <Stack direction={{ xs: 'column', xl: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', xl: 'flex-start' }}>
                <Stack spacing={0.75} sx={{ maxWidth: 680 }}>
                  <Typography className="app-section-label">Creative Performance Suite</Typography>
                  <Typography variant="h3" sx={{ maxWidth: 580, fontSize: { xs: '1.9rem', md: '2.3rem', xl: '2.5rem' }, lineHeight: 1 }}>
                    Gesture-controlled audio, staged like a real instrument.
                  </Typography>
                </Stack>

                <Box className="hero-transport-cluster">
                  <Typography component="span" className="hero-transport-label">Session</Typography>
                  <Box className="hero-transport-actions">
                    <Button variant="contained" className="hero-transport-button is-primary" onClick={() => void startSources()}>
                      Power Up Studio
                    </Button>
                    <Button variant="text" color="inherit" className="hero-transport-button" onClick={() => void stopSources()}>
                      Reset Session
                    </Button>
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

                <Box className="hero-status-strip">
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
              </Stack>
            </Stack>

            <Box className="dashboard-grid">
              <Box className="stage-stack">
                <Paper className="glass-panel" elevation={0} sx={{ p: 0, borderRadius: '28px' }}>
                  <Box className="camera-shell">
                    <Box className="stage-caption">
                      <Typography className="app-section-label" sx={{ mb: 1 }}>Live Visual Stage</Typography>
                      <Typography variant="h5" sx={{ mb: 0.75 }}>Performance camera</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {lastGesture
                          ? `Tracking ${gestureLabels[lastGesture.gesture]} at ${Math.round(lastGesture.confidence * 100)}% confidence.`
                          : 'Bring your hand into frame to start driving the effect chain.'}
                      </Typography>
                    </Box>

                    <Box className="stage-chrome">
                      <Box className="stage-pill">{liveStatus}</Box>
                      <Box className="stage-pill">{settings.enableGestureDebugOverlay ? 'Debug overlay on' : 'Debug overlay off'}</Box>
                    </Box>

                    <CameraStage>
                      <CameraPreview stream={cameraStream} videoRef={videoRef} />
                      {settings.enableGestureDebugOverlay ? <GestureOverlay frame={gestureFrame} videoRef={videoRef} /> : null}
                    </CameraStage>
                  </Box>
                </Paper>

                {cameraError ? <Alert severity="error">{cameraError}</Alert> : null}
                {gestureError ? <Alert severity="warning">{gestureError}</Alert> : null}
                <Alert severity="info">{statusMessage}</Alert>
              </Box>

              <Box className="sidebar-stack">
                <Paper className="glass-panel" elevation={0} sx={panelSx}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography className="app-section-label">Session Control</Typography>
                      <Typography variant="h5" sx={{ mt: 0.75 }}>Studio transport</Typography>
                    </Box>

                    <Box className="quick-status-grid">
                      <Box className="metric-tile compact-metric-tile">
                        <span className="metric-kicker">System</span>
                        <div className="metric-value">{systemTone}</div>
                      </Box>
                      <Box className="metric-tile compact-metric-tile">
                        <span className="metric-kicker">Gesture</span>
                        <div className="metric-value">{currentGestureLabel}</div>
                      </Box>
                      <Box className="metric-tile compact-metric-tile">
                        <span className="metric-kicker">Mode</span>
                        <div className="metric-value">{recordingMode === 'video' ? 'AV' : 'Audio'}</div>
                      </Box>
                    </Box>

                    <Box className="controls-grid">
                      <Button variant="contained" fullWidth onClick={() => void startSources()}>
                        Start Inputs
                      </Button>
                      <Button variant="outlined" color="inherit" fullWidth onClick={() => void stopSources()}>
                        Stop Inputs
                      </Button>
                      {!recordingActive ? (
                        <Button variant="contained" color="secondary" fullWidth onClick={() => void startRecording()}>
                          Start Recording
                        </Button>
                      ) : (
                        <Button variant="contained" color="error" fullWidth onClick={() => void stopRecording()}>
                          Stop and Save
                        </Button>
                      )}
                      <FormControl fullWidth sx={fieldSx}>
                        <InputLabel id="recording-mode">Recording Mode</InputLabel>
                        <Select
                          labelId="recording-mode"
                          label="Recording Mode"
                          value={recordingMode}
                          onChange={(event) => setRecordingMode(event.target.value as RecordingMode)}
                        >
                          <MenuItem value="audio">Audio Only</MenuItem>
                          <MenuItem value="video">Video + Processed Audio</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <FormControlLabel
                      sx={{ m: 0, justifyContent: 'space-between' }}
                      control={
                        <Switch
                          checked={settings.enableGestureDebugOverlay}
                          onChange={(_event, checked) => setGestureDebugOverlayEnabled(checked)}
                        />
                      }
                      label="Show gesture debug overlay"
                      labelPlacement="start"
                    />
                  </Stack>
                </Paper>

                <Accordion disableGutters defaultExpanded={false} className="glass-accordion">
                  <AccordionSummary
                    expandIcon={<Box component="span" className="accordion-icon">+</Box>}
                    aria-controls="gesture-router-content"
                    id="gesture-router-header"
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                      <Box>
                        <Typography className="app-section-label">Gesture Router</Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>Mapping matrix</Typography>
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

                                <Button variant="outlined" color="inherit" onClick={() => removeGestureMapping(index)} sx={{ minWidth: { sm: 124 } }}>
                                  Remove
                                </Button>
                              </Stack>
                            </Stack>
                          </Box>
                        ))}

                        <Button variant="outlined" color="inherit" onClick={() => addGestureMapping()}>
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
                      <Box>
                        <Typography className="app-section-label">Effect Sculpting</Typography>
                        <Typography variant="h6" sx={{ mt: 0.5 }}>Live parameter deck</Typography>
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

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2">Low-pass Frequency</Typography>
                          <Typography variant="body2" color="text.secondary">{Math.round(lowPassFrequency)} Hz</Typography>
                        </Stack>
                        <Slider min={100} max={20000} value={lowPassFrequency} onChange={(_event, value) => setLowPassFrequency(value as number)} />
                      </Box>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2">High-pass Frequency</Typography>
                          <Typography variant="body2" color="text.secondary">{Math.round(highPassFrequency)} Hz</Typography>
                        </Stack>
                        <Slider min={20} max={5000} value={highPassFrequency} onChange={(_event, value) => setHighPassFrequency(value as number)} />
                      </Box>

                      <Box>
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
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
