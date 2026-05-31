import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from '../../features/audio/AudioEngine';
import { RecordingController } from '../../features/recording/RecordingController';
import type { RecordingMode } from '../../features/settings/types';
import { downloadBlob } from '../../utils/file';
import { nowFileName } from '../config';

type UseStudioSessionParams = {
  cameraStream: MediaStream | null;
  startCamera: () => Promise<MediaStream>;
  stopCamera: () => void;
  recordingMode: RecordingMode;
  lowPassFrequency: number;
  highPassFrequency: number;
  outputGain: number;
  setRecordingActive: (active: boolean) => void;
  onStatusMessage: (message: string) => void;
};

type UseStudioSessionResult = {
  audioState: ReturnType<AudioEngine['getState']>;
  startSources: () => Promise<void>;
  stopSources: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
};

export const useStudioSession = ({
  cameraStream,
  startCamera,
  stopCamera,
  recordingMode,
  lowPassFrequency,
  highPassFrequency,
  outputGain,
  setRecordingActive,
  onStatusMessage
}: UseStudioSessionParams): UseStudioSessionResult => {
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const recorderRef = useRef<RecordingController>(new RecordingController());

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
    onStatusMessage('Audio chain started');

    return nextStream;
  };

  const startSources = async (): Promise<void> => {
    try {
      await Promise.all([startAudio(), startCamera()]);
      onStatusMessage('Camera and microphone are live');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not start media sources';
      onStatusMessage(message);
    }
  };

  const stopSources = async (): Promise<void> => {
    stopCamera();
    micStream?.getTracks().forEach((track) => track.stop());
    setMicStream(null);
    await audioEngineRef.current.dispose();
    onStatusMessage('Media sources stopped');
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
      onStatusMessage('Recording started');
    } catch {
      onStatusMessage('Unable to start recording');
      setRecordingActive(false);
    }
  };

  const stopRecording = async (): Promise<void> => {
    try {
      const blob = await recorderRef.current.stop();
      await downloadBlob(blob, nowFileName(recordingMode));
      onStatusMessage('Recording saved successfully');
    } catch {
      onStatusMessage('Recording stopped, but save failed');
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
    return () => {
      stopCamera();
      micStream?.getTracks().forEach((track) => track.stop());
      void audioEngineRef.current.dispose();
    };
  }, [micStream, stopCamera]);

  return {
    audioState,
    startSources,
    stopSources,
    startRecording,
    stopRecording
  };
};