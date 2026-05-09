import type { Cell } from "../renderer-diff.js";

export interface TetrisState {
  fallingPieces: TetrisPiece[];
  landedCells: TetrisCell[];
  width: number;
  height: number;
}

interface TetrisPiece {
  shape: number[][];
  x: number;
  startY: number;
  speed: number;
  phase: number;
  char: string;
  style: "bold" | "dim";
}

interface TetrisCell {
  x: number;
  y: number;
  char: string;
}

const TETROMINOS: { shape: number[][]; char: string }[] = [
  { shape: [[1, 1, 1, 1]], char: "█" },
  {
    shape: [
      [1, 1],
      [1, 1],
    ],
    char: "▓",
  },
  {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    char: "▒",
  },
  {
    shape: [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    char: "░",
  },
  {
    shape: [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    char: "▓",
  },
  {
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    char: "█",
  },
  {
    shape: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
    char: "▒",
  },
];

export function generateTetrisBackground(
  width: number,
  height: number,
  seed: number,
): TetrisState {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };

  const fallingPieces: TetrisPiece[] = [];
  const pieceCount = Math.max(4, Math.floor(width / 8));
  for (let i = 0; i < pieceCount; i++) {
    const tetromino = TETROMINOS[Math.floor(rand() * TETROMINOS.length)]!;
    fallingPieces.push({
      shape: tetromino.shape,
      x: Math.floor(rand() * Math.max(1, width - 4)),
      startY: -Math.floor(rand() * height),
      speed: 0.5 + rand() * 1.5,
      phase: rand() * 20_000,
      char: tetromino.char,
      style: rand() < 0.3 ? "bold" : "dim",
    });
  }

  const landedCells: TetrisCell[] = [];
  const landedCount = Math.max(5, Math.floor(width / 4));
  const bottomRows = Math.min(4, Math.max(1, Math.floor(height * 0.2)));
  const chars = ["█", "▓", "▒", "░"];
  for (let i = 0; i < landedCount; i++) {
    const lx = Math.floor(rand() * width);
    const ly = height - 1 - Math.floor(rand() * bottomRows);
    landedCells.push({
      x: lx,
      y: ly,
      char: chars[Math.floor(rand() * chars.length)]!,
    });
  }

  return { fallingPieces, landedCells, width, height };
}

export function renderTetrisRow(
  state: TetrisState,
  cells: Cell[],
  row: number,
  xOffset: number,
  width: number,
  now: number,
): void {
  if (width <= 0) return;

  for (const piece of state.fallingPieces) {
    const elapsed = (now + piece.phase) / 1000;
    const currentY = piece.startY + elapsed * piece.speed * 2;
    const wrappedY = ((currentY % (state.height + 6)) + state.height + 6) % (state.height + 6) - 3;
    const pieceRow = row - Math.floor(wrappedY);

    if (pieceRow < 0 || pieceRow >= piece.shape.length) continue;
    const shapeLine = piece.shape[pieceRow]!;
    for (let i = 0; i < shapeLine.length; i++) {
      if (!shapeLine[i]) continue;
      const cx = piece.x + i - xOffset;
      if (cx < 0 || cx >= width) continue;
      if (cells[cx]!.char !== " ") continue;
      cells[cx] = { char: piece.char, style: piece.style, width: 1 };
    }
  }

  for (const cell of state.landedCells) {
    if (cell.y !== row) continue;
    const cx = cell.x - xOffset;
    if (cx < 0 || cx >= width) continue;
    if (cells[cx]!.char !== " ") continue;
    cells[cx] = { char: cell.char, style: "dim", width: 1 };
  }

  if (row === state.height - 1) {
    for (let x = 0; x < width; x++) {
      if (cells[x]!.char !== " ") continue;
      if ((x + xOffset) % 3 === 0) {
        cells[x] = { char: "·", style: "dim", width: 1 };
      }
    }
  }
}
