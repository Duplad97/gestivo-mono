import { useEffect, useState } from 'react';

export type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

type UseMediaDevicesResult = {
  cameras: MediaDeviceOption[];
  microphones: MediaDeviceOption[];
};

const withFallbackLabel = (device: MediaDeviceInfo, index: number, typeLabel: string): MediaDeviceOption => {
  return {
    deviceId: device.deviceId,
    label: device.label || `${typeLabel} ${index + 1}`
  };
};

export const useMediaDevices = (): UseMediaDevicesResult => {
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    let cancelled = false;

    const refreshDevices = async (): Promise<void> => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        if (cancelled) {
          return;
        }

        const nextCameras = devices
          .filter((device) => device.kind === 'videoinput')
          .map((device, index) => withFallbackLabel(device, index, 'Camera'));
        const nextMicrophones = devices
          .filter((device) => device.kind === 'audioinput')
          .map((device, index) => withFallbackLabel(device, index, 'Microphone'));

        setCameras(nextCameras);
        setMicrophones(nextMicrophones);
      } catch {
        if (!cancelled) {
          setCameras([]);
          setMicrophones([]);
        }
      }
    };

    void refreshDevices();

    const onDeviceChange = (): void => {
      void refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);

    return () => {
      cancelled = true;
      navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
    };
  }, []);

  return { cameras, microphones };
};
