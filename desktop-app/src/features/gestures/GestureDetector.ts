import type { GestureEvent } from './types';

export type GestureListener = (event: GestureEvent) => void;

export class GestureDetector {
  private rafId: number | null = null;

  start(listener: GestureListener): void {
    const loop = (): void => {
      const event: GestureEvent = {
        gesture: 'open_hand',
        confidence: 0,
        timestamp: Date.now()
      };

      listener(event);
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
  }
}
