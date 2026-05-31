import type { GestureEvent, GestureName } from './types';

type VisionModule = typeof import('@mediapipe/tasks-vision');
type HandLandmarkerInstance = import('@mediapipe/tasks-vision').HandLandmarker;

export type GestureListener = (event: GestureEvent) => void;
export type GestureFrameListener = (frame: GestureFrame) => void;

type Landmark = {
  x: number;
  y: number;
  z: number;
};

type ClassifiedGesture = {
  gesture: GestureName;
  confidence: number;
  value?: number;
};

export type GestureFrame = {
  landmarks: Landmark[];
  gesture: {
    name: GestureName;
    confidence: number;
    value?: number;
  } | null;
  hasHand: boolean;
  timestamp: number;
};

const MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm';

const distanceBetween = (a: Landmark, b: Landmark): number => {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const isFingerExtended = (landmarks: Landmark[], tipIndex: number, pipIndex: number): boolean => {
  return landmarks[tipIndex].y < landmarks[pipIndex].y;
};

const classifyGesture = (landmarks: Landmark[]): ClassifiedGesture | null => {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbJoint = landmarks[3];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  const indexExtended = isFingerExtended(landmarks, 8, 6);
  const middleExtended = isFingerExtended(landmarks, 12, 10);
  const ringExtended = isFingerExtended(landmarks, 16, 14);
  const pinkyExtended = isFingerExtended(landmarks, 20, 18);
  const thumbRaised = thumbTip.y < thumbJoint.y && thumbTip.y < wrist.y;

  const palmSize = distanceBetween(wrist, middleTip) || 1;
  const pinchDistance = distanceBetween(thumbTip, indexTip) / palmSize;
  const pinchStrength = clamp(1 - pinchDistance / 0.32, 0, 1);
  const curledFingers = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter((value) => !value).length;

  if (pinchStrength > 0.68) {
    return {
      gesture: 'pinch',
      confidence: pinchStrength,
      value: pinchStrength
    };
  }

  if (thumbRaised && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return {
      gesture: 'thumbs_up',
      confidence: 0.88,
      value: clamp(distanceBetween(thumbTip, wrist) / 0.45, 0, 1)
    };
  }

  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return {
      gesture: 'open_hand',
      confidence: 0.82,
      value: clamp(distanceBetween(indexTip, pinkyTip) / 0.42, 0, 1)
    };
  }

  if (curledFingers >= 4 && pinchStrength < 0.34) {
    return {
      gesture: 'fist',
      confidence: 0.8
    };
  }

  if (indexTip.y < indexPip.y && middleTip.y < middlePip.y && ringTip.y > ringPip.y && pinkyTip.y > pinkyPip.y) {
    return {
      gesture: 'open_hand',
      confidence: 0.45
    };
  }

  return null;
};

export class GestureDetector {
  private handLandmarker: HandLandmarkerInstance | null = null;
  private visionModulePromise: Promise<VisionModule> | null = null;
  private rafId: number | null = null;
  private lastGestureAt = 0;
  private lastGestureKey: string | null = null;

  private loadVisionModule(): Promise<VisionModule> {
    if (!this.visionModulePromise) {
      this.visionModulePromise = import('@mediapipe/tasks-vision');
    }

    return this.visionModulePromise;
  }

  private async ensureInitialized(): Promise<HandLandmarkerInstance> {
    if (this.handLandmarker) {
      return this.handLandmarker;
    }

    const { FilesetResolver, HandLandmarker } = await this.loadVisionModule();
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_PATH
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    return this.handLandmarker;
  }

  async start(videoElement: HTMLVideoElement, listener: GestureListener, onFrame?: GestureFrameListener): Promise<void> {
    const handLandmarker = await this.ensureInitialized();

    const loop = (): void => {
      if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const timestamp = performance.now();
        const result = handLandmarker.detectForVideo(videoElement, timestamp);
        const landmarks = result.landmarks[0] as Landmark[] | undefined;
        const classified = landmarks ? classifyGesture(landmarks) : null;

        onFrame?.({
          landmarks: landmarks ?? [],
          gesture: classified
            ? {
                name: classified.gesture,
                confidence: classified.confidence,
                value: classified.value
              }
            : null,
          hasHand: landmarks !== undefined,
          timestamp: Date.now()
        });

        if (landmarks) {
          if (classified) {
            const gestureKey = `${classified.gesture}:${Math.round((classified.value ?? 0) * 100)}`;
            const now = Date.now();

            if (this.lastGestureKey !== gestureKey || now - this.lastGestureAt > 120) {
              this.lastGestureKey = gestureKey;
              this.lastGestureAt = now;

              const event: GestureEvent = {
                gesture: classified.gesture,
                confidence: classified.confidence,
                value: classified.value,
                timestamp: now
              };

              listener(event);
            }
          }
        }
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.stop();
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.lastGestureAt = 0;
    this.lastGestureKey = null;
  }

  dispose(): void {
    this.stop();
    this.handLandmarker?.close();
    this.handLandmarker = null;
  }
}
