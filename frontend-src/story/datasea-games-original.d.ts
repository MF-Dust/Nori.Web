import type { ComponentType } from "react";

export interface DataseaGameApi {
  onProgress(progress: number): void;
  onSolved(): void;
  hit(intensity: number): void;
}

export const DATASEA_GAME_COMPONENTS: Record<
  string,
  ComponentType<{ api: DataseaGameApi }>
>;
