export function createCorruptionGlitch(target?: HTMLElement): {
  update(milliseconds: number, enabled: boolean): void;
  dispose(): void;
};
