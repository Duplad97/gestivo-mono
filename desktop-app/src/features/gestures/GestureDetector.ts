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

const averageLandmark = (...points: Landmark[]): Landmark => {
  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
      z: accumulator.z + point.z
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
    z: total.z / points.length
  };
};

const isFingerExtended = (landmarks: Landmark[], tipIndex: number, pipIndex: number): boolean => {
  return landmarks[tipIndex].y < landmarks[pipIndex].y;
};

const normalizedDistance = (a: Landmark, b: Landmark, palmSize: number): number => {
  return distanceBetween(a, b) / palmSize;
};

const average = (values: number[]): number => {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const averageDistanceToPoint = (origin: Landmark, points: Landmark[]): number => {
  return average(points.map((point) => distanceBetween(origin, point)));
};

const getPinchScale = (wrist: Landmark, indexMcp: Landmark, middleMcp: Landmark, pinkyMcp: Landmark): number => {
  return Math.max(
    distanceBetween(indexMcp, pinkyMcp),
    distanceBetween(wrist, middleMcp),
    averageDistanceToPoint(wrist, [indexMcp, middleMcp, pinkyMcp]) * 1.35
  );
};

const getFingerCurlScore = (
  wrist: Landmark,
  tip: Landmark,
  dip: Landmark,
  pip: Landmark,
  mcp: Landmark,
  palmCenter: Landmark,
  palmSize: number
): number => {
  const tipToMcp = normalizedDistance(tip, mcp, palmSize);
  const tipToPip = normalizedDistance(tip, pip, palmSize);
  const dipToMcp = normalizedDistance(dip, mcp, palmSize);
  const pipToMcp = normalizedDistance(pip, mcp, palmSize);
  const tipToWrist = normalizedDistance(tip, wrist, palmSize);
  const mcpToWrist = normalizedDistance(mcp, wrist, palmSize);
  const tipToPalm = normalizedDistance(tip, palmCenter, palmSize);

  const mcpFoldScore = clamp((0.92 - tipToMcp) / 0.48, 0, 1);
  const pipFoldScore = clamp((0.72 - tipToPip) / 0.34, 0, 1);
  const dipCompressionScore = clamp((dipToMcp - tipToMcp + 0.08) / 0.3, 0, 1);
  const wristFoldScore = clamp((mcpToWrist * 1.22 - tipToWrist) / 0.42, 0, 1);
  const palmCompactScore = clamp((0.96 - tipToPalm) / 0.34, 0, 1);
  const pipBaseScore = clamp((0.52 - pipToMcp) / 0.26, 0, 1);

  return mcpFoldScore * 0.26 + pipFoldScore * 0.24 + dipCompressionScore * 0.16 + wristFoldScore * 0.2 + palmCompactScore * 0.08 + pipBaseScore * 0.06;
};

const isFingerLikelyExtended = (
  wrist: Landmark,
  tip: Landmark,
  pip: Landmark,
  mcp: Landmark,
  palmSize: number,
  yExtended: boolean
): boolean => {
  const tipToWrist = normalizedDistance(tip, wrist, palmSize);
  const pipToWrist = normalizedDistance(pip, wrist, palmSize);
  const mcpToWrist = normalizedDistance(mcp, wrist, palmSize);

  return yExtended && tipToWrist > pipToWrist * 1.04 && tipToWrist > mcpToWrist * 1.22;
};

const isFingerLikelyCurled = (
  wrist: Landmark,
  palmCenter: Landmark,
  tip: Landmark,
  pip: Landmark,
  mcp: Landmark,
  palmSize: number,
  yExtended: boolean
): boolean => {
  const tipToWrist = normalizedDistance(tip, wrist, palmSize);
  const pipToWrist = normalizedDistance(pip, wrist, palmSize);
  const mcpToWrist = normalizedDistance(mcp, wrist, palmSize);
  const tipToPalm = normalizedDistance(tip, palmCenter, palmSize);
  const pipToPalm = normalizedDistance(pip, palmCenter, palmSize);

  const compactTowardPalm = tipToPalm < 0.72 && tipToPalm < pipToPalm * 1.08;
  const foldedTowardWrist = tipToWrist < pipToWrist * 1.08 && tipToWrist < mcpToWrist * 1.22;

  return compactTowardPalm && (foldedTowardWrist || !yExtended);
};

const classifyGesture = (landmarks: Landmark[]): ClassifiedGesture | null => {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbJoint = landmarks[3];
  const indexMcp = landmarks[5];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleMcp = landmarks[9];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringMcp = landmarks[13];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyMcp = landmarks[17];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const palmCenter = averageLandmark(indexMcp, middleMcp, ringMcp, pinkyMcp);
  const indexDip = landmarks[7];
  const middleDip = landmarks[11];
  const ringDip = landmarks[15];
  const pinkyDip = landmarks[19];

  const palmSize = averageDistanceToPoint(wrist, [indexMcp, middleMcp, ringMcp, pinkyMcp]) || 1;
  const pinchScale = getPinchScale(wrist, indexMcp, middleMcp, pinkyMcp) || palmSize;
  const indexExtended = isFingerLikelyExtended(wrist, indexTip, indexPip, indexMcp, palmSize, isFingerExtended(landmarks, 8, 6));
  const middleExtended = isFingerLikelyExtended(wrist, middleTip, middlePip, middleMcp, palmSize, isFingerExtended(landmarks, 12, 10));
  const ringExtended = isFingerLikelyExtended(wrist, ringTip, ringPip, ringMcp, palmSize, isFingerExtended(landmarks, 16, 14));
  const pinkyExtended = isFingerLikelyExtended(wrist, pinkyTip, pinkyPip, pinkyMcp, palmSize, isFingerExtended(landmarks, 20, 18));
  const fingertipPalmDistances = [indexTip, middleTip, ringTip, pinkyTip].map((tip) => {
    return normalizedDistance(tip, palmCenter, palmSize);
  });
  const fingertipWristDistances = [indexTip, middleTip, ringTip, pinkyTip].map((tip) => {
    return normalizedDistance(tip, wrist, palmSize);
  });
  const fingerCurlScores = [
    [indexTip, indexDip, indexPip, indexMcp],
    [middleTip, middleDip, middlePip, middleMcp],
    [ringTip, ringDip, ringPip, ringMcp],
    [pinkyTip, pinkyDip, pinkyPip, pinkyMcp]
  ].map(([tip, dip, pip, mcp]) => {
    return getFingerCurlScore(wrist, tip, dip, pip, mcp, palmCenter, palmSize);
  });
  const curledFingers = [
    isFingerLikelyCurled(wrist, palmCenter, indexTip, indexPip, indexMcp, palmSize, isFingerExtended(landmarks, 8, 6)),
    isFingerLikelyCurled(wrist, palmCenter, middleTip, middlePip, middleMcp, palmSize, isFingerExtended(landmarks, 12, 10)),
    isFingerLikelyCurled(wrist, palmCenter, ringTip, ringPip, ringMcp, palmSize, isFingerExtended(landmarks, 16, 14)),
    isFingerLikelyCurled(wrist, palmCenter, pinkyTip, pinkyPip, pinkyMcp, palmSize, isFingerExtended(landmarks, 20, 18))
  ].filter(Boolean).length;
  const stronglyCurledFingers = fingerCurlScores.filter((score) => score > 0.6).length;
  const moderatelyCurledFingers = fingerCurlScores.filter((score) => score > 0.45).length;
  const averageFingerCurlScore = average(fingerCurlScores);
  const averageFingertipPalmDistance = average(fingertipPalmDistances);
  const averageFingertipWristDistance = average(fingertipWristDistances);
  const maxFingertipPalmDistance = Math.max(...fingertipPalmDistances);

  const pinchDistance = distanceBetween(thumbTip, indexTip) / pinchScale;
  const pinchStrength = clamp(1 - pinchDistance / 0.42, 0, 1);
  const thumbToIndexBase = normalizedDistance(thumbTip, indexMcp, palmSize);
  const thumbToWrist = normalizedDistance(thumbTip, wrist, palmSize);
  const thumbRaised = thumbTip.y < thumbJoint.y && thumbTip.y < indexMcp.y;
  const thumbExtended = thumbRaised && thumbToIndexBase > 0.58 && thumbToWrist > 0.72;

  if (pinchStrength > 0.68) {
    return {
      gesture: 'pinch',
      confidence: pinchStrength,
      value: pinchStrength
    };
  }

  const fistLikeShape =
    moderatelyCurledFingers >= 3 &&
    stronglyCurledFingers >= 2 &&
    averageFingerCurlScore > 0.52 &&
    averageFingertipWristDistance < 1.42 &&
    maxFingertipPalmDistance < 1.18 &&
    pinchStrength < 0.62;

  if (fistLikeShape) {
    return {
      gesture: 'fist',
      confidence: clamp(
        0.54 +
          averageFingerCurlScore * 0.28 +
          stronglyCurledFingers * 0.08 +
          moderatelyCurledFingers * 0.04 +
          (1.02 - averageFingertipPalmDistance) * 0.08 -
          pinchStrength * 0.12,
        0,
        0.96
      )
    };
  }

  if (thumbExtended && curledFingers >= 3 && averageFingertipPalmDistance < 0.96 && pinchStrength < 0.52) {
    return {
      gesture: 'thumbs_up',
      confidence: clamp(0.7 + (thumbToWrist - 0.72) * 0.45, 0, 0.96),
      value: clamp((thumbToWrist - 0.72) / 0.5, 0, 1)
    };
  }

  if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return {
      gesture: 'open_hand',
      confidence: 0.82,
      value: clamp(distanceBetween(indexTip, pinkyTip) / 0.42, 0, 1)
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
