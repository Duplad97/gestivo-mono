import type { AudioEngineState } from './types';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export class AudioEngine {
  private context: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private lowPass: BiquadFilterNode | null = null;
  private highPass: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private initialized = false;

  async initialize(micStream: MediaStream): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.context = new AudioContext({ latencyHint: 'interactive' });
    this.micSource = this.context.createMediaStreamSource(micStream);
    this.lowPass = this.context.createBiquadFilter();
    this.lowPass.type = 'lowpass';
    this.lowPass.frequency.value = 20000;

    this.highPass = this.context.createBiquadFilter();
    this.highPass.type = 'highpass';
    this.highPass.frequency.value = 20;

    this.gain = this.context.createGain();
    this.gain.gain.value = 1;

    this.destination = this.context.createMediaStreamDestination();

    this.micSource
      .connect(this.lowPass)
      .connect(this.highPass)
      .connect(this.gain)
      .connect(this.context.destination);

    this.gain.connect(this.destination);

    this.initialized = true;
  }

  getState(): AudioEngineState {
    return {
      initialized: this.initialized,
      activeEffects: ['lowPass', 'highPass', 'gain']
    };
  }

  getProcessedAudioStream(): MediaStream {
    if (!this.destination) {
      throw new Error('Audio engine is not initialized.');
    }

    return this.destination.stream;
  }

  setLowPassFrequency(value: number): void {
    if (!this.lowPass) {
      return;
    }

    this.lowPass.frequency.value = clamp(value, 100, 20000);
  }

  setHighPassFrequency(value: number): void {
    if (!this.highPass) {
      return;
    }

    this.highPass.frequency.value = clamp(value, 20, 5000);
  }

  setOutputGain(value: number): void {
    if (!this.gain) {
      return;
    }

    this.gain.gain.value = clamp(value, 0, 2);
  }

  async dispose(): Promise<void> {
    if (!this.context) {
      return;
    }

    await this.context.close();
    this.context = null;
    this.micSource = null;
    this.lowPass = null;
    this.highPass = null;
    this.gain = null;
    this.destination = null;
    this.initialized = false;
  }
}
