import type { Cell } from "../renderer-diff.js";

export interface MarioState {
  clouds: MarioCloud[];
  blocks: MarioBlock[];
  pipes: MarioPipe[];
  groundY: number;
  width: number;
  height: number;
}

interface MarioCloud {
  x: number;
  y: number;
  speed: number;
  shape: string[];
}

interface MarioBlock {
  x: number;
  y: number;
  type: "?" | "brick";
  phase: number;
}

interface MarioPipe {
  x: number;
  height: number;
  side: "left" | "right";
}

const CLOUD_SHAPES = [
  ["  .--.  ", " (    ) ", "(      )", " `----' "],
  [" .--. ", "(    )", " `--' "],
  ["  .-.  ", " (   ) ", "  `-'  "],
] as const;

export function generateMarioBackground(
  width: number,
  height: number,
  seed: number,
): MarioState {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };

  const clouds: MarioCloud[] = [];
  const cloudCount = Math.max(2, Math.floor(width / 20));
  for (let i = 0; i < cloudCount; i++) {
    const shapeIdx = Math.floor(rand() * CLOUD_SHAPES.length);
    clouds.push({
      x: Math.floor(rand() * width),
      y: 1 + Math.floor(rand() * Math.max(1, Math.floor(height * 0.3))),
      speed: 0.3 + rand() * 0.7,
      shape: [...CLOUD_SHAPES[shapeIdx]!],
    });
  }

  const blocks: MarioBlock[] = [];
  const blockCount = Math.max(3, Math.floor(width / 12));
  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      x: Math.floor(rand() * width),
      y: 2 + Math.floor(rand() * Math.max(1, height - 4)),
      type: rand() < 0.4 ? "?" : "brick",
      phase: rand() * Math.PI * 2,
    });
  }

  const pipes: MarioPipe[] = [];
  const pipeCount = Math.max(1, Math.floor(width / 30));
  for (let i = 0; i < pipeCount; i++) {
    pipes.push({
      x: Math.floor(rand() * Math.max(1, width - 4)),
      height: 2 + Math.floor(rand() * 3),
      side: rand() < 0.5 ? "left" : "right",
    });
  }

  return {
    clouds,
    blocks,
    pipes,
    groundY: height - 1,
    width,
    height,
  };
}

export function renderMarioRow(
  state: MarioState,
  cells: Cell[],
  row: number,
  xOffset: number,
  width: number,
  now: number,
): void {
  if (width <= 0) return;

  const drift = now / 1000;

  for (const cloud of state.clouds) {
    const cloudX = Math.floor(
      ((cloud.x + drift * cloud.speed * 2) % (state.width + 20)) - 10,
    );
    const cloudRow = row - cloud.y;
    if (cloudRow < 0 || cloudRow >= cloud.shape.length) continue;
    const line = cloud.shape[cloudRow]!;
    for (let i = 0; i < line.length; i++) {
      const cx = cloudX + i - xOffset;
      if (cx < 0 || cx >= width || line[i] === " ") continue;
      cells[cx] = { char: line[i]!, style: "dim", width: 1 };
    }
  }

  for (const block of state.blocks) {
    if (row !== block.y) continue;
    const bx = block.x - xOffset;
    if (bx < 0 || bx >= width) continue;

    if (block.type === "?") {
      const blink = Math.sin(now / 600 + block.phase) > 0.3;
      cells[bx] = {
        char: blink ? "?" : "·",
        style: blink ? "bold" : "dim",
        width: 1,
      };
    } else {
      cells[bx] = { char: "#", style: "dim", width: 1 };
    }
  }

  for (const pipe of state.pipes) {
    const pipeTop = state.groundY - pipe.height;
    if (row < pipeTop || row > state.groundY) continue;

    const px = pipe.x - xOffset;
    if (row === pipeTop) {
      if (px >= 0 && px < width)
        cells[px] = { char: "┌", style: "dim", width: 1 };
      if (px + 1 >= 0 && px + 1 < width)
        cells[px + 1] = { char: "─", style: "dim", width: 1 };
      if (px + 2 >= 0 && px + 2 < width)
        cells[px + 2] = { char: "─", style: "dim", width: 1 };
      if (px + 3 >= 0 && px + 3 < width)
        cells[px + 3] = { char: "┐", style: "dim", width: 1 };
    } else {
      if (px >= 0 && px < width)
        cells[px] = { char: "│", style: "dim", width: 1 };
      if (px + 3 >= 0 && px + 3 < width)
        cells[px + 3] = { char: "│", style: "dim", width: 1 };
    }
  }

  if (row === state.groundY) {
    const groundChars = ["▄", "▀", "█", "▄"] as const;
    for (let x = 0; x < width; x++) {
      if (cells[x]!.char !== " ") continue;
      const gx = (x + xOffset) % 8;
      if (gx < 4) {
        cells[x] = {
          char: groundChars[gx]!,
          style: "dim",
          width: 1,
        };
      }
    }
  }

  if (row === state.groundY - 1) {
    const coinX = Math.floor(
      ((drift * 3) % (state.width + 10)) - 5,
    );
    const cx = coinX - xOffset;
    if (cx >= 0 && cx < width && cells[cx]!.char === " ") {
      const coinFrame = Math.floor(now / 200) % 4;
      const coinChars = ["○", "◎", "●", "◎"] as const;
      cells[cx] = { char: coinChars[coinFrame]!, style: "bold", width: 1 };
    }
  }
}
