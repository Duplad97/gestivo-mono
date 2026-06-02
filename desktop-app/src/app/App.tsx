import { useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Box,
  Container,
  Paper,
  Stack
} from '@mui/material';
import { useCameraStream } from '../features/camera/useCameraStream';
import { AppHeader } from './components/AppHeader';
import { SettingsScreen } from './components/SettingsScreen';
import { StudioDashboard } from './components/StudioDashboard';
import { actionLabels, fieldSx, gestureLabels, panelSx, triggerModeLabels } from './config';
import { useGestureRouter } from './hooks/useGestureRouter';
import { useGestureTracking } from './hooks/useGestureTracking';
import { usePersistedPreferences } from './hooks/usePersistedPreferences';
import { useStudioSession } from './hooks/useStudioSession';
import { useMediaDevices } from './hooks/useMediaDevices';
import { ShaderBackdrop } from '../components/ShaderBackdrop';
import { GestureDetector } from '../features/gestures/GestureDetector';
import { getGestureMappingWarnings } from '../features/gestures/getGestureMappingWarnings';
import { useAppStore } from '../stores/appStore';

export const App = (): ReactElement => {
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [activeScreen, setActiveScreen] = useState<'studio' | 'settings'>('studio');

  const gestureDetectorRef = useRef<GestureDetector>(new GestureDetector());
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
  const setPreferredCameraDeviceId = useAppStore((state) => state.setPreferredCameraDeviceId);
  const setPreferredMicrophoneDeviceId = useAppStore((state) => state.setPreferredMicrophoneDeviceId);
  const setGestureMapping = useAppStore((state) => state.setGestureMapping);
  const addGestureMapping = useAppStore((state) => state.addGestureMapping);
  const removeGestureMapping = useAppStore((state) => state.removeGestureMapping);
  const hydratePreferences = useAppStore((state) => state.hydratePreferences);

  const { lastGesture, handleGestureEvent } = useGestureRouter({
    gestureMappings,
    setLowPassFrequency,
    setOutputGain
  });

  usePersistedPreferences({
    settings,
    gestureMappings,
    hydratePreferences,
    onLoadError: setStatusMessage
  });

  const { cameras, microphones } = useMediaDevices();

  const { audioState, startSources, stopSources, startRecording, stopRecording } = useStudioSession({
    cameraStream,
    startCamera,
    stopCamera,
    preferredCameraDeviceId: settings.preferredCameraDeviceId,
    preferredMicrophoneDeviceId: settings.preferredMicrophoneDeviceId,
    recordingMode: settings.recordingMode,
    lowPassFrequency,
    highPassFrequency,
    outputGain,
    setRecordingActive,
    onStatusMessage: setStatusMessage
  });

  const gestureMappingWarnings = useMemo(() => getGestureMappingWarnings(gestureMappings), [gestureMappings]);
  const currentGestureLabel = lastGesture ? gestureLabels[lastGesture.gesture] : 'Awaiting input';
  const currentGestureConfidence = lastGesture ? `${Math.round(lastGesture.confidence * 100)}%` : 'No hand';
  const inputsActive = isCameraActive || audioState.initialized;
  const liveStatus = recordingActive ? 'Recording' : isCameraActive || audioState.initialized ? 'Ready' : 'Standby';
  const systemTone = recordingActive ? 'Hot' : isCameraActive && audioState.initialized ? 'Live' : 'Idle';
  const sessionPanelTone = recordingActive ? 'is-recording' : inputsActive ? 'is-live' : 'is-idle';
  const modeTileIcon = settings.recordingMode === 'video' ? <VideocamRoundedIcon className="metric-icon" fontSize="small" /> : <GraphicEqRoundedIcon className="metric-icon" fontSize="small" />;
  const edgeRouteCount = gestureMappings.filter((mapping) => mapping.triggerMode === 'edge').length;
  const gestureRouterSummary = `${gestureMappings.length} shortcuts • ${edgeRouteCount} one-time • ${gestureMappings.length - edgeRouteCount} live control`;
  const effectDeckSummary = `Brightness ${Math.round(lowPassFrequency)} Hz • Cleanup ${Math.round(highPassFrequency)} Hz • Volume ${outputGain.toFixed(2)}x`;
  const requiredDeviceMessage = [cameraError, statusMessage].find(
    (message) =>
      typeof message === 'string'
      && /(no (camera|microphone|mic) device was found|requested device not found|device not found)/i.test(message)
  ) ?? null;
  const stageState = cameraError
    ? {
        icon: <WarningAmberRoundedIcon fontSize="small" />,
        title: 'Camera feed unavailable',
        description: cameraError,
        tone: 'error' as const
      }
    : cameraStream
      ? null
      : inputsActive
        ? {
            icon: <HourglassTopRoundedIcon fontSize="small" />,
            title: 'Waiting for visual stage',
            description: 'Audio is armed. Bring the camera online to restore the live preview and gesture tracking.',
            tone: 'warming' as const
          }
        : {
            icon: <VideocamRoundedIcon fontSize="small" />,
            title: 'Camera stage on standby',
            description: 'Start inputs to open the live preview and begin hand tracking.',
            tone: 'idle' as const
          };

  const { gestureFrame } = useGestureTracking({
    cameraStream,
    videoRef,
    gestureMappings,
    gestureDetector: gestureDetectorRef.current,
    onGestureEvent: handleGestureEvent
  });

  return (
    <Box className="app-shell">
      <ShaderBackdrop />
      <Container maxWidth="xl">
        <Paper className="glass-panel app-frame" elevation={0} sx={{ p: { xs: 1.5, md: 2.25, xl: 2.5 }, borderRadius: '32px' }}>
          <Stack spacing={2} className="app-frame-stack">
            <AppHeader
              activeScreen={activeScreen}
              inputsActive={inputsActive}
              recordingActive={recordingActive}
              audioInitialized={audioState.initialized}
              isCameraActive={isCameraActive}
              onToggleSettingsScreen={() => setActiveScreen((currentScreen) => (currentScreen === 'settings' ? 'studio' : 'settings'))}
              onStartSources={startSources}
              onStopSources={stopSources}
            />

            {activeScreen === 'settings' ? (
              <SettingsScreen
                settings={settings}
                panelSx={panelSx}
                fieldSx={fieldSx}
                cameras={cameras}
                microphones={microphones}
                onSetThemeMode={setThemeMode}
                onSetRecordingMode={setRecordingMode}
                onSetGestureDebugOverlayEnabled={setGestureDebugOverlayEnabled}
                onSetPreferredCameraDeviceId={setPreferredCameraDeviceId}
                onSetPreferredMicrophoneDeviceId={setPreferredMicrophoneDeviceId}
              />
            ) : (
              <StudioDashboard
                panelSx={panelSx}
                fieldSx={fieldSx}
                videoRef={videoRef}
                cameraStream={cameraStream}
                gestureFrame={gestureFrame}
                stageState={stageState}
                requiredDeviceMessage={requiredDeviceMessage}
                lastGestureLabel={lastGesture ? gestureLabels[lastGesture.gesture] : null}
                currentGestureConfidence={currentGestureConfidence}
                liveStatus={liveStatus}
                inputsActive={inputsActive}
                debugOverlayEnabled={settings.enableGestureDebugOverlay}
                sessionPanelTone={sessionPanelTone}
                recordingActive={recordingActive}
                systemTone={systemTone}
                currentGestureLabel={currentGestureLabel}
                modeTileIcon={modeTileIcon}
                recordingMode={settings.recordingMode}
                gestureRouterSummary={gestureRouterSummary}
                gestureMappingWarnings={gestureMappingWarnings}
                gestureMappings={gestureMappings}
                gestureLabels={gestureLabels}
                actionLabels={actionLabels}
                triggerModeLabels={triggerModeLabels}
                effectDeckSummary={effectDeckSummary}
                lowPassFrequency={lowPassFrequency}
                highPassFrequency={highPassFrequency}
                outputGain={outputGain}
                onStartSources={startSources}
                onStopSources={stopSources}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onSetLowPassFrequency={setLowPassFrequency}
                onSetHighPassFrequency={setHighPassFrequency}
                onSetOutputGain={setOutputGain}
                onSetGestureMapping={setGestureMapping}
                onAddGestureMapping={addGestureMapping}
                onRemoveGestureMapping={removeGestureMapping}
              />
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};
