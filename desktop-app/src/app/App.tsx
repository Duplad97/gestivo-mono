import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Typography
} from '@mui/material';
import { AudioEngine } from '../features/audio/AudioEngine';
import { CameraPreview } from '../features/camera/CameraPreview';
import { useCameraStream } from '../features/camera/useCameraStream';
import { GestureDetector } from '../features/gestures/GestureDetector';
import { mapGestureToAction } from '../features/gestures/GestureMapper';
import type { GestureEvent } from '../features/gestures/types';
import { RecordingController } from '../features/recording/RecordingController';
import { useAppStore } from '../stores/appStore';
import { downloadBlob } from '../utils/file';

type RecordingMode = 'audio' | 'video';

const nowFileName = (mode: RecordingMode): string => {
  const date = new Date();
  const iso = date.toISOString().replace(/[:.]/g, '-');
  const suffix = mode === 'video' ? 'webm' : 'webm';
  return `gestivo-${mode}-${iso}.${suffix}`;
};

export const App = (): ReactElement => {
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('audio');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [lastGesture, setLastGesture] = useState<GestureEvent | null>(null);
  const [gestureError, setGestureError] = useState<string | null>(null);

  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const recorderRef = useRef<RecordingController>(new RecordingController());
  const gestureDetectorRef = useRef<GestureDetector>(new GestureDetector());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lowPassFocusEnabledRef = useRef(false);

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
  const gestureMappings = useAppStore((state) => state.gestureMappings);
  const setLowPassFrequency = useAppStore((state) => state.setLowPassFrequency);
  const setHighPassFrequency = useAppStore((state) => state.setHighPassFrequency);
  const setOutputGain = useAppStore((state) => state.setOutputGain);
  const setRecordingActive = useAppStore((state) => state.setRecordingActive);

  const audioState = useMemo(() => audioEngineRef.current.getState(), [micStream]);

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

    const action = mapGestureToAction(event, gestureMappings);

    if (!action) {
      return;
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
      return;
    }

    let cancelled = false;

    const startDetection = async (): Promise<void> => {
      try {
        await gestureDetectorRef.current.start(videoElement, (event) => {
          if (!cancelled) {
            applyGestureEvent(event);
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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid rgba(255,255,255,0.16)',
          backdropFilter: 'blur(10px)',
          background: 'linear-gradient(170deg, rgba(20,27,41,0.85), rgba(9,11,17,0.9))'
        }}
      >
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h4">Gestivo Desktop MVP</Typography>
              <Typography variant="body1" color="text.secondary">
                Real-time webcam input and gesture-ready audio processing foundation.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                color={audioState.initialized ? 'success' : 'default'}
                label={audioState.initialized ? 'Audio Engine Live' : 'Audio Engine Idle'}
              />
              <Chip color={isCameraActive ? 'success' : 'default'} label={isCameraActive ? 'Camera Live' : 'Camera Idle'} />
              <Chip
                color={lastGesture ? 'secondary' : 'default'}
                label={lastGesture ? `Gesture: ${lastGesture.gesture}` : 'Gesture Idle'}
              />
            </Stack>
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3}>
            <Stack spacing={2} flex={2}>
              <CameraPreview stream={cameraStream} videoRef={videoRef} />
              {cameraError ? <Alert severity="error">{cameraError}</Alert> : null}
              {gestureError ? <Alert severity="warning">{gestureError}</Alert> : null}
            </Stack>

            <Stack spacing={2} flex={1}>
              <Typography variant="h6">Session</Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" onClick={() => void startSources()}>
                  Start Inputs
                </Button>
                <Button variant="outlined" color="inherit" onClick={() => void stopSources()}>
                  Stop Inputs
                </Button>
              </Stack>

              <FormControl fullWidth>
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

              <Stack direction="row" spacing={1}>
                {!recordingActive ? (
                  <Button variant="contained" color="secondary" onClick={() => void startRecording()}>
                    Start Recording
                  </Button>
                ) : (
                  <Button variant="contained" color="error" onClick={() => void stopRecording()}>
                    Stop and Save
                  </Button>
                )}
              </Stack>

              <Divider />

              <Typography variant="h6">Effects</Typography>
              <Alert severity="success">
                {lastGesture
                  ? `Detected ${lastGesture.gesture} with ${Math.round(lastGesture.confidence * 100)}% confidence`
                  : 'Show a hand to the camera to drive the audio controls.'}
              </Alert>
              <Box>
                <Typography gutterBottom>Low-pass Frequency: {Math.round(lowPassFrequency)} Hz</Typography>
                <Slider
                  min={100}
                  max={20000}
                  value={lowPassFrequency}
                  onChange={(_event, value) => setLowPassFrequency(value as number)}
                />
              </Box>

              <Box>
                <Typography gutterBottom>High-pass Frequency: {Math.round(highPassFrequency)} Hz</Typography>
                <Slider
                  min={20}
                  max={5000}
                  value={highPassFrequency}
                  onChange={(_event, value) => setHighPassFrequency(value as number)}
                />
              </Box>

              <Box>
                <Typography gutterBottom>Output Gain: {outputGain.toFixed(2)}x</Typography>
                <Slider min={0} max={2} step={0.01} value={outputGain} onChange={(_event, value) => setOutputGain(value as number)} />
              </Box>
            </Stack>
          </Stack>

          <Alert severity="info">{statusMessage}</Alert>
        </Stack>
      </Paper>
    </Container>
  );
};
