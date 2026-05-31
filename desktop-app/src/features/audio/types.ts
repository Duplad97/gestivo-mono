export interface AudioEffect {
  readonly id: string;
  enable(): void;
  disable(): void;
  setParameter(name: string, value: number): void;
}

export type AudioEngineState = {
  initialized: boolean;
  activeEffects: string[];
};
