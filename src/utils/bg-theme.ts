import type { Cell, Style } from "../renderer-diff.js";

export type BackgroundTheme =
  | "stars"
  | "mario"
  | "tetris"
  | "dragon"
  | "invaders"
  | "pac"
  | "zelda";

export interface BgElement {
  x: number;
  y: number;
  char: string;
  style: Style;
}

export interface BackgroundState {
  theme: BackgroundTheme;
  elements: BgElement[];
  width: number;
  height: number;
  seed: number;
}

export interface BackgroundRenderer {
  generate(width: number, height: number, seed: number): BackgroundState;
  renderRow(
    state: BackgroundState,
    cells: Cell[],
    row: number,
    xOffset: number,
    width: number,
    now: number,
  ): void;
}

export function selectBackgroundTheme(seed = Math.random()): BackgroundTheme {
  const themes: BackgroundTheme[] = [
    "stars",
    "mario",
    "tetris",
    "dragon",
    "invaders",
    "pac",
    "zelda",
  ];
  const normalized = Number.isFinite(seed) ? Math.abs(seed) % 1 : 0;
  return themes[Math.floor(normalized * themes.length)]!;
}
