import type { Cell, Style } from "../renderer-diff.js";

export interface RetroSprite {
  x: number;
  y: number;
  shape: string[];
  style: Style;
  speed: number;
  phase: number;
}

export interface RetroBackgroundState {
  theme: "dragon" | "invaders" | "pac" | "zelda";
  sprites: RetroSprite[];
  width: number;
  height: number;
}

const SPRITES = {
  dragon: [
    ["  _", "<o)", "/ \\"],
    ["*", " o ", "/|\\"],
    ["( )", " O ", "( )"],
  ],
  invaders: [
    [" /M\\ ", "<ooo>"],
    ["-o-o-", " / \\ "],
    ["[===]", " /|\\"],
  ],
  pac: [["C"], ["ᗧ"], ["o"], ["ᗣ"]],
  zelda: [["/\\", "\\/"], ["<>"], ["Y"], ["△"]],
} as const;

const THEME_STYLES: Record<RetroBackgroundState["theme"], Style[]> = {
  dragon: ["yellow", "cyan", "magenta"],
  invaders: ["green", "cyan", "magenta"],
  pac: ["yellow", "cyan", "red"],
  zelda: ["green", "yellow", "cyan"],
};

export function generateRetroBackground(
  theme: RetroBackgroundState["theme"],
  width: number,
  height: number,
  seed: number,
): RetroBackgroundState {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };

  const shapes = SPRITES[theme];
  const styles = THEME_STYLES[theme];
  const spriteCount = Math.max(5, Math.floor(width / 14));
  const sprites: RetroSprite[] = [];

  for (let i = 0; i < spriteCount; i++) {
    const shape = shapes[Math.floor(rand() * shapes.length)]!;
    sprites.push({
      x: Math.floor(rand() * Math.max(1, width)),
      y: Math.floor(rand() * Math.max(1, height)),
      shape: [...shape],
      style: styles[Math.floor(rand() * styles.length)]!,
      speed: 0.2 + rand() * 0.9,
      phase: rand() * 10_000,
    });
  }

  return { theme, sprites, width, height };
}

export function renderRetroRow(
  state: RetroBackgroundState,
  cells: Cell[],
  row: number,
  xOffset: number,
  width: number,
  now: number,
): void {
  if (width <= 0) return;

  for (const sprite of state.sprites) {
    const drift = Math.floor(((now + sprite.phase) / 1000) * sprite.speed * 2);
    const spriteX =
      ((((sprite.x + drift) % (state.width + 8)) + state.width + 8) %
        (state.width + 8)) -
      4;
    const spriteRow = row - sprite.y;
    if (spriteRow < 0 || spriteRow >= sprite.shape.length) continue;

    const line = sprite.shape[spriteRow]!;
    for (let i = 0; i < line.length; i++) {
      const char = line[i]!;
      if (char === " ") continue;
      const cx = spriteX + i - xOffset;
      if (cx < 0 || cx >= width) continue;
      cells[cx] = { char, style: sprite.style, width: 1 };
    }
  }

  if (state.theme === "pac" && row === state.height - 1) {
    for (let x = 0; x < width; x += 4) {
      if (cells[x]!.char === " ") {
        cells[x] = { char: "·", style: "yellow", width: 1 };
      }
    }
  }
}
