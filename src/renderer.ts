import process from "node:process";
import {
  generateMeteorShower,
  generateStarField,
  getMeteorTrail,
  getStarState,
  type Meteor,
  type Star,
} from "./utils/stars.js";
import { getMoonPhase } from "./utils/moon.js";
import type { TerminalPet } from "./utils/pet.js";
import { renderTextAsArt } from "./utils/box-font.js";
import {
  type BackgroundTheme,
  selectBackgroundTheme,
} from "./utils/bg-theme.js";
import {
  generateMarioBackground,
  renderMarioRow,
  type MarioState,
} from "./utils/bg-mario.js";
import {
  generateTetrisBackground,
  renderTetrisRow,
  type TetrisState,
} from "./utils/bg-tetris.js";
import { formatElapsed } from "./utils/time.js";
import { formatTokens } from "./utils/tokens.js";
import { wordWrap } from "./utils/wordwrap.js";
import type { Orchestrator, OrchestratorState } from "./core/orchestrator.js";
import {
  type Cell,
  type Style,
  textToCells,
  emptyCells,
  rowToString,
  diffFrames,
  emitDiff,
} from "./renderer-diff.js";

// ── Constants ────────────────────────────────────────────────

const CONTENT_WIDTH = 63;
const MAX_PROMPT_LINES = 3;
const BASE_CONTENT_ROWS = 24;
const STAR_DENSITY = 0.035;
const DEFAULT_METEOR_FREQUENCY = 3;
const METEOR_SEED_OFFSET = 101;
const TICK_MS = 200;
const MOONS_PER_ROW = 30;
const MOON_PHASE_PERIOD = 1600;
const MAX_MSG_LINES = 3;
const MAX_MSG_LINE_LEN = CONTENT_WIDTH;
const RESUME_HINT = "[ctrl+c to stop, animo again to resume]";
const GRACEFUL_STOP_HINT =
  "[graceful stop requested, ctrl+c again to force stop, animo again to resume]";
const DONE_HINT = "[ctrl+c to exit]";
const MODERN_QUOTES = [
  {
    text: "Make it work, make it right, make it fast.",
    author: "Kent Beck",
  },
  {
    text: "Simplicity is prerequisite for reliability.",
    author: "Edsger W. Dijkstra",
  },
  {
    text: "The best way to predict the future is to invent it.",
    author: "Alan Kay",
  },
  {
    text: "Premature optimization is the root of all evil.",
    author: "Donald Knuth",
  },
  {
    text: "Programs must be written for people to read.",
    author: "Harold Abelson",
  },
  {
    text: "Stay hungry, stay foolish.",
    author: "Steve Jobs",
  },
  {
    text: "What you do every day matters more than what you do once.",
    author: "Gretchen Rubin",
  },
  {
    text: "The journey is the reward.",
    author: "Steve Jobs",
  },
] as const;

export type ModernQuote = (typeof MODERN_QUOTES)[number];

export type RendererExitReason = "interrupted" | "stopped";

export interface RendererOptions {
  meteorFrequency?: number;
  backgroundTheme?: BackgroundTheme;
}

// ── ANSI helpers ─────────────────────────────────────────────

export function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

// ── Cell-based render functions ──────────────────────────────

function spacedLabel(text: string): string {
  return text.split("").join(" ");
}

function formatTokenCount(
  tokens: number,
  direction: "in" | "out",
  estimated = false,
): string {
  const prefix = estimated ? "~" : "";
  return `${prefix}${formatTokens(tokens)} ${direction}`;
}

function formatCommitCount(commitCount: number): string {
  const commitLabel = commitCount === 1 ? "commit" : "commits";
  return `${commitCount} ${commitLabel}`;
}

function buildTerminalTitle(state: OrchestratorState, now: number): string {
  const lead =
    state.status === "running" || state.status === "waiting"
      ? getMoonPhase("active", now, MOON_PHASE_PERIOD)
      : state.status;
  return (
    `animo ${lead}` +
    ` · ${formatTokenCount(state.totalInputTokens, "in", state.tokensEstimated)}` +
    ` · ${formatTokenCount(state.totalOutputTokens, "out", state.tokensEstimated)}` +
    ` · ${formatCommitCount(state.commitCount)}`
  );
}

function emitTerminalTitle(title: string): string {
  return `\x1b]2;${title}\x07`;
}

function saveTerminalTitle(): string {
  return "\x1b[22;0t";
}

function restoreTerminalTitle(): string {
  return "\x1b[23;0t";
}

function eyebrowSegments(agentName: string): string[] {
  // Render "acp:<target>" as two segments separated by the same dot used
  // between "animo" and the agent name: "a n i m o \u00b7 a c p \u00b7 claude".
  if (agentName.startsWith("acp:")) {
    const target = agentName.slice("acp:".length);
    if (target.length > 0) return ["acp", target];
  }
  return [agentName];
}

export function renderTitleCells(agentName?: string): Cell[][] {
  const segments = agentName ? eyebrowSegments(agentName) : [];
  const separator: Cell[] = [
    ...textToCells("  ", "normal"),
    ...textToCells("\u00b7", "dim"),
    ...textToCells("  ", "normal"),
  ];
  const eyebrow: Cell[] = [
    ...textToCells(spacedLabel("animo"), "dim"),
    ...segments.flatMap((segment) => [
      ...separator,
      ...textToCells(spacedLabel(segment), "dim"),
    ]),
  ];

  return [eyebrow, []];
}

export function renderStatsCells(
  elapsed: string,
  inputTokens: number,
  outputTokens: number,
  commitCount: number,
  tokensEstimated = false,
): Cell[] {
  return [
    ...textToCells(elapsed, "bold"),
    ...textToCells("  ", "normal"),
    ...textToCells("\u00b7", "dim"),
    ...textToCells("  ", "normal"),
    ...textToCells(
      formatTokenCount(inputTokens, "in", tokensEstimated),
      "normal",
    ),
    ...textToCells("  ", "normal"),
    ...textToCells("\u00b7", "dim"),
    ...textToCells("  ", "normal"),
    ...textToCells(
      formatTokenCount(outputTokens, "out", tokensEstimated),
      "normal",
    ),
    ...textToCells("  ", "normal"),
    ...textToCells("\u00b7", "dim"),
    ...textToCells("  ", "normal"),
    ...textToCells(formatCommitCount(commitCount), "normal"),
  ];
}

export function renderAgentMessageCells(
  message: string | null,
  status: string,
  lastAgentError?: string | null,
): Cell[][] {
  const lines: string[] = [];
  if (status === "waiting") {
    lines.push("waiting (backoff)...");
    if (lastAgentError) {
      lines.push(...wordWrap(lastAgentError, MAX_MSG_LINE_LEN, 2));
    }
  } else if (status === "aborted" && lastAgentError) {
    lines.push(
      ...wordWrap(
        message ?? "max consecutive failures reached",
        MAX_MSG_LINE_LEN,
        1,
      ),
    );
    lines.push(...wordWrap(lastAgentError, MAX_MSG_LINE_LEN, 2));
  } else if (status === "aborted" && !message) {
    lines.push("max consecutive failures reached");
  } else if (!message) {
    lines.push("working...");
  } else {
    const wrapped = wordWrap(message, MAX_MSG_LINE_LEN, MAX_MSG_LINES);
    for (const wl of wrapped) {
      lines.push(wl);
    }
  }
  while (lines.length < MAX_MSG_LINES) lines.push("");
  return lines.map((l) => (l ? textToCells(l, "dim") : []));
}

export function renderMoonStripCells(
  iterations: { success: boolean }[],
  isRunning: boolean,
  now: number,
): Cell[][] {
  const moons: string[] = iterations.map((iter) =>
    getMoonPhase(iter.success ? "success" : "fail"),
  );
  if (isRunning) {
    moons.push(getMoonPhase("active", now, MOON_PHASE_PERIOD));
  }
  if (moons.length === 0) return [[]];
  const rows: Cell[][] = [];
  for (let i = 0; i < moons.length; i += MOONS_PER_ROW) {
    const slice = moons.slice(i, i + MOONS_PER_ROW);
    const cells: Cell[] = [];
    for (const moon of slice) {
      cells.push(...textToCells(moon, "normal"));
    }
    rows.push(cells);
  }
  return rows;
}

export function selectModernQuote(seed = Math.random()): ModernQuote {
  const normalized = Number.isFinite(seed) ? Math.abs(seed) % 1 : 0;
  return MODERN_QUOTES[Math.floor(normalized * MODERN_QUOTES.length)]!;
}

export function renderModernQuoteCells(quote: ModernQuote): Cell[][] {
  const artLines = renderTextAsArt(quote.text, CONTENT_WIDTH);
  const rows: Cell[][] = [];
  for (const [line0, line1, line2] of artLines) {
    rows.push(textToCells(line0, "bold"));
    rows.push(textToCells(line1, "bold"));
    rows.push(textToCells(line2, "bold"));
  }
  rows.push([]);
  rows.push(textToCells(`- ${quote.author}`, "dim"));
  return rows;
}

// ── String wrappers (preserve existing API) ──────────────────

export function renderTitle(agentName?: string): string[] {
  return renderTitleCells(agentName).map(rowToString);
}

export function renderStats(
  elapsed: string,
  inputTokens: number,
  outputTokens: number,
  commitCount: number,
  tokensEstimated = false,
): string {
  return rowToString(
    renderStatsCells(
      elapsed,
      inputTokens,
      outputTokens,
      commitCount,
      tokensEstimated,
    ),
  );
}

export function renderAgentMessage(
  message: string | null,
  status: string,
  lastAgentError?: string | null,
): string[] {
  return renderAgentMessageCells(message, status, lastAgentError).map(
    rowToString,
  );
}

export function renderMoonStrip(
  iterations: { success: boolean }[],
  isRunning: boolean,
  now: number,
): string[] {
  return renderMoonStripCells(iterations, isRunning, now).map(rowToString);
}

// ── Star rendering (cell-based) ─────────────────────────────

function starStyle(state: "bright" | "dim" | "hidden"): Style {
  if (state === "bright") return "bold";
  if (state === "dim") return "dim";
  return "normal";
}

function meteorCountForFrequency(frequency: number): number {
  if (frequency <= 0) return 0;
  if (frequency === 1) return 1;
  if (frequency === 2) return 2;
  if (frequency === 3) return 4;
  if (frequency === 4) return 6;
  return 28;
}

function meteorsStartingBefore(
  meteors: Meteor[],
  rowOffset: number,
  maxStartRow: number,
): Meteor[] {
  return meteors.filter((meteor) => rowOffset + meteor.y < maxStartRow);
}

export function generateSideMeteorShower(
  terminalWidth: number,
  sideWidth: number,
  height: number,
  count: number,
  seed: number,
): Meteor[] {
  if (sideWidth <= 0 || height <= 0 || count <= 0) return [];

  const leftCount = Math.max(1, Math.ceil(count / 2));
  const rightCount = count - leftCount;
  const leftMeteors = generateMeteorShower(sideWidth, height, leftCount, seed);
  const rightXOffset = terminalWidth - sideWidth;
  const rightMeteors = generateMeteorShower(
    sideWidth,
    height,
    rightCount,
    seed + 1,
  ).map((meteor) => ({ ...meteor, x: meteor.x + rightXOffset }));

  return [...leftMeteors, ...rightMeteors];
}

function placeStarsInCells(
  cells: Cell[],
  stars: Star[],
  row: number,
  xMin: number,
  xMax: number,
  xOffset: number,
  now: number,
): void {
  for (const star of stars) {
    if (star.y !== row || star.x < xMin || star.x >= xMax) continue;
    const state = getStarState(star, now);
    const localX = star.x - xOffset;
    cells[localX] =
      state === "hidden"
        ? { char: " ", style: "normal", width: 1 }
        : { char: star.char, style: starStyle(state), width: 1 };
  }
}

function placeMeteorsInCells(
  cells: Cell[],
  meteors: Meteor[],
  row: number,
  xMin: number,
  xMax: number,
  xOffset: number,
  now: number,
): void {
  for (const meteor of meteors) {
    for (const trail of getMeteorTrail(meteor, now)) {
      if (trail.y !== row || trail.x < xMin || trail.x >= xMax) continue;
      const localX = trail.x - xOffset;
      cells[localX] = {
        char: trail.char,
        style: trail.state === "bright" ? "bold" : "dim",
        width: 1,
      };
    }
  }
}

function renderStarLineCells(
  stars: Star[],
  meteors: Meteor[],
  width: number,
  y: number,
  now: number,
  absoluteRow = y,
): Cell[] {
  const cells = emptyCells(width);
  placeAuroraInCells(cells, 0, width, absoluteRow, now);
  placeStarsInCells(cells, stars, y, 0, width, 0, now);
  placeMeteorsInCells(cells, meteors, y, 0, width, 0, now);
  return cells;
}

function placeAuroraInCells(
  cells: Cell[],
  xOffset: number,
  width: number,
  absoluteRow: number,
  now: number,
): void {
  if (width <= 0) return;

  const drift = now / 1_400;
  const lowerBand = 10 + Math.sin(drift / 5) * 3;
  const upperBand = 3 + Math.cos(drift / 6) * 2;
  const glyphs = ["~", "=", "-", "_"] as const;

  for (let localX = 0; localX < width; localX++) {
    const x = xOffset + localX;
    const wave =
      Math.sin((x + drift * 8) / 12) * 1.8 +
      Math.sin((x - drift * 5) / 23) * 1.2;
    const nearLower = Math.abs(absoluteRow - (lowerBand + wave)) < 0.36;
    const nearUpper = Math.abs(absoluteRow - (upperBand + wave * 0.6)) < 0.22;
    if (!nearLower && !nearUpper) continue;

    cells[localX] = {
      char: glyphs[(x + absoluteRow) % glyphs.length]!,
      style: "dim",
      width: 1,
    };
  }
}

export function renderStarFieldLines(
  seed: number,
  width: number,
  height: number,
  now: number,
  meteorFrequency = DEFAULT_METEOR_FREQUENCY,
): string[] {
  const stars = generateStarField(width, height, STAR_DENSITY, seed);
  const meteors = generateMeteorShower(
    width,
    height,
    meteorCountForFrequency(meteorFrequency),
    seed + METEOR_SEED_OFFSET,
  );
  const lines: string[] = [];
  for (let y = 0; y < height; y++) {
    lines.push(rowToString(renderStarLineCells(stars, meteors, width, y, now)));
  }
  return lines;
}



function renderThemedLineCells(
  theme: BackgroundTheme,
  stars: Star[],
  meteors: Meteor[],
  mario: MarioState | null,
  tetris: TetrisState | null,
  width: number,
  y: number,
  now: number,
  absoluteRow = y,
): Cell[] {
  const cells = emptyCells(width);
  if (theme === "mario" && mario) {
    renderMarioRow(mario, cells, absoluteRow, 0, width, now);
  } else if (theme === "tetris" && tetris) {
    renderTetrisRow(tetris, cells, absoluteRow, 0, width, now);
  } else {
    placeAuroraInCells(cells, 0, width, absoluteRow, now);
    placeStarsInCells(cells, stars, y, 0, width, 0, now);
    placeMeteorsInCells(cells, meteors, y, 0, width, 0, now);
  }
  return cells;
}

function renderThemedSideCells(
  theme: BackgroundTheme,
  stars: Star[],
  meteors: Meteor[],
  mario: MarioState | null,
  tetris: TetrisState | null,
  rowIndex: number,
  xOffset: number,
  sideWidth: number,
  now: number,
  absoluteRow = rowIndex,
): Cell[] {
  if (sideWidth <= 0) return [];
  const cells = emptyCells(sideWidth);
  if (theme === "mario" && mario) {
    renderMarioRow(mario, cells, absoluteRow, xOffset, sideWidth, now);
  } else if (theme === "tetris" && tetris) {
    renderTetrisRow(tetris, cells, absoluteRow, xOffset, sideWidth, now);
  } else {
    placeAuroraInCells(cells, xOffset, sideWidth, absoluteRow, now);
    placeStarsInCells(
      cells,
      stars,
      rowIndex,
      xOffset,
      xOffset + sideWidth,
      xOffset,
      now,
    );
    placeMeteorsInCells(
      cells,
      meteors,
      rowIndex,
      xOffset,
      xOffset + sideWidth,
      xOffset,
      now,
    );
  }
  return cells;
}

function clampCellsToWidth(content: Cell[], width: number): Cell[] {
  if (content.length <= width) return content;

  const clamped: Cell[] = [];
  let remaining = width;

  for (let i = 0; i < content.length && remaining > 0; i++) {
    const cell = content[i];
    if (cell.width === 0) continue;
    if (cell.width > remaining) break;

    clamped.push(cell);
    remaining -= cell.width;

    if (cell.width === 2 && content[i + 1]?.width === 0) {
      clamped.push(content[i + 1]);
      i += 1;
    }
  }

  return clamped;
}

function centerLineCells(content: Cell[], width: number): Cell[] {
  const clamped = clampCellsToWidth(content, width);
  const w = clamped.length;
  const pad = Math.max(0, Math.floor((width - w) / 2));
  const rightPad = Math.max(0, width - w - pad);
  return [...emptyCells(pad), ...clamped, ...emptyCells(rightPad)];
}

function renderResumeHintCells(
  width: number,
  interruptHint: OrchestratorState["interruptHint"],
): Cell[] {
  const hint =
    interruptHint === "exit"
      ? DONE_HINT
      : interruptHint === "force-stop"
        ? GRACEFUL_STOP_HINT
        : RESUME_HINT;
  return centerLineCells(textToCells(hint, "dim"), width);
}


// ── Build full frame (cell-based) ────────────────────────────

/**
 * Builds the centered content viewport for the renderer.
 *
 * When `availableHeight` is constrained, the layout drops optional sections in
 * priority order (ASCII art, eyebrow, agent message, then prompt) so the stats
 * row remains visible and any remaining space is used for the newest moon rows.
 */
export function buildContentCells(
  prompt: string,
  agentName: string,
  state: OrchestratorState,
  elapsed: string,
  now: number,
  availableHeight?: number,
  quote: ModernQuote = selectModernQuote(0),
): Cell[][] {
  const isRunning = state.status === "running" || state.status === "waiting";
  const moonRows = renderMoonStripCells(state.iterations, isRunning, now);
  const maxRows = availableHeight ?? Infinity;
  if (maxRows <= 0) return [];

  const titleCells = renderTitleCells(agentName);
  const titleSpacer = titleCells[1] ?? [];
  const promptLines = wordWrap(prompt, CONTENT_WIDTH, MAX_PROMPT_LINES);
  const promptRows: Cell[][] = [];
  for (let i = 0; i < MAX_PROMPT_LINES; i++) {
    const pl = promptLines[i] ?? "";
    promptRows.push(pl ? textToCells(pl, "dim") : []);
  }

  const sections = {
    top: [[]] as Cell[][],
    eyebrow: [titleCells[0], [], []] as Cell[][],
    art: titleCells.slice(2),
    quote: [[], ...renderModernQuoteCells(quote)] as Cell[][],
    prompt: [titleSpacer, ...promptRows, []] as Cell[][],
    stats: [
      renderStatsCells(
        elapsed,
        state.totalInputTokens,
        state.totalOutputTokens,
        state.commitCount,
        state.tokensEstimated,
      ),
    ] as Cell[][],
    agent: [
      [],
      ...renderAgentMessageCells(
        state.lastMessage,
        state.status,
        state.lastAgentError,
      ),
    ],
    moon: [[], ...moonRows] as Cell[][],
  };

  const flattenSections = (): Cell[][] => [
    ...sections.top,
    ...sections.eyebrow,
    ...sections.art,
    ...sections.quote,
    ...sections.prompt,
    ...sections.stats,
    ...sections.agent,
    ...sections.moon,
  ];

  const optionalSections: Array<keyof typeof sections> = [
    "quote",
    "eyebrow",
    "agent",
    "prompt",
  ];

  let rows = flattenSections();
  for (const section of optionalSections) {
    if (rows.length <= maxRows) break;
    sections[section] = [];
    rows = flattenSections();
  }

  if (rows.length > maxRows) {
    rows = rows.filter((row) => row.length > 0);
  }

  if (rows.length > maxRows) {
    const nonMoonRows = [
      ...sections.top,
      ...sections.eyebrow,
      ...sections.art,
      ...sections.quote,
      ...sections.prompt,
      ...sections.stats,
      ...sections.agent,
    ].filter((row) => row.length > 0);
    const allowedMoonRows = Math.max(0, maxRows - nonMoonRows.length);
    const visibleMoonRows =
      allowedMoonRows === 0
        ? []
        : moonRows.filter((row) => row.length > 0).slice(-allowedMoonRows);
    rows = [...nonMoonRows, ...visibleMoonRows];
  }

  return rows;
}

export function buildFrameCells(
  prompt: string,
  agentName: string,
  state: OrchestratorState,
  topStars: Star[],
  bottomStars: Star[],
  sideStars: Star[],
  now: number,
  terminalWidth: number,
  terminalHeight: number,
  topMeteors: Meteor[] = [],
  bottomMeteors: Meteor[] = [],
  sideMeteors: Meteor[] = [],
  quote: ModernQuote = selectModernQuote(0),
  _pet?: TerminalPet,
  bgTheme: BackgroundTheme = "stars",
  marioState: MarioState | null = null,
  tetrisState: TetrisState | null = null,
): Cell[][] {
  const elapsedMs = now - state.startTime.getTime();
  const elapsed = formatElapsed(elapsedMs);
  const reservedBottomRows = 2;
  const availableHeight = Math.max(0, terminalHeight - reservedBottomRows);
  const contentRows = buildContentCells(
    prompt,
    agentName,
    state,
    elapsed,
    now,
    availableHeight,
    quote,
  );

  while (contentRows.length < Math.min(BASE_CONTENT_ROWS, availableHeight)) {
    contentRows.push([]);
  }

  const contentCount = contentRows.length;
  const remaining = Math.max(0, availableHeight - contentCount);
  const topHeight = Math.max(0, Math.ceil(remaining / 2));
  const bottomHeight = remaining - topHeight;
  const maxMeteorStartRow = Math.ceil(availableHeight * 0.75);
  const visibleTopMeteors = meteorsStartingBefore(
    topMeteors,
    0,
    maxMeteorStartRow,
  );
  const visibleSideMeteors = meteorsStartingBefore(
    sideMeteors,
    topHeight,
    maxMeteorStartRow,
  );
  const visibleBottomMeteors = meteorsStartingBefore(
    bottomMeteors,
    topHeight + contentCount,
    maxMeteorStartRow,
  );

  const sideWidth = Math.max(
    0,
    Math.floor((terminalWidth - CONTENT_WIDTH) / 2),
  );
  const rightSideWidth = Math.max(0, terminalWidth - sideWidth - CONTENT_WIDTH);

  const frame: Cell[][] = [];

  for (let y = 0; y < topHeight; y++) {
    frame.push(
      renderThemedLineCells(
        bgTheme,
        topStars,
        visibleTopMeteors,
        marioState,
        tetrisState,
        terminalWidth,
        y,
        now,
        y,
      ),
    );
  }

  for (let i = 0; i < contentRows.length; i++) {
    const left = renderThemedSideCells(
      bgTheme,
      sideStars,
      visibleSideMeteors,
      marioState,
      tetrisState,
      i,
      0,
      sideWidth,
      now,
      topHeight + i,
    );
    const center = centerLineCells(contentRows[i], CONTENT_WIDTH);
    const right = renderThemedSideCells(
      bgTheme,
      sideStars,
      visibleSideMeteors,
      marioState,
      tetrisState,
      i,
      terminalWidth - rightSideWidth,
      rightSideWidth,
      now,
      topHeight + i,
    );
    frame.push([...left, ...center, ...right]);
  }

  for (let y = 0; y < bottomHeight; y++) {
    frame.push(
      renderThemedLineCells(
        bgTheme,
        bottomStars,
        visibleBottomMeteors,
        marioState,
        tetrisState,
        terminalWidth,
        y,
        now,
        topHeight + contentCount + y,
      ),
    );
  }

  frame.push(renderResumeHintCells(terminalWidth, state.interruptHint));
  frame.push(emptyCells(terminalWidth));

  return frame;
}

// ── String wrappers for frame building ───────────────────────

export function buildContentLines(
  prompt: string,
  agentName: string,
  state: OrchestratorState,
  elapsed: string,
  now: number,
): string[] {
  return buildContentCells(prompt, agentName, state, elapsed, now).map(
    rowToString,
  );
}

export function buildFrame(
  prompt: string,
  agentName: string,
  state: OrchestratorState,
  topStars: Star[],
  bottomStars: Star[],
  sideStars: Star[],
  now: number,
  terminalWidth: number,
  terminalHeight: number,
): string {
  const cells = buildFrameCells(
    prompt,
    agentName,
    state,
    topStars,
    bottomStars,
    sideStars,
    now,
    terminalWidth,
    terminalHeight,
  );
  return "\x1b[H" + cells.map(rowToString).join("\n");
}

// ── Renderer class ───────────────────────────────────────────

export class Renderer {
  private orchestrator: Orchestrator;
  private prompt: string;
  private agentName: string;
  private state: OrchestratorState;
  private interval: ReturnType<typeof setInterval> | null = null;
  private exitResolve!: (reason: RendererExitReason) => void;
  private exitPromise: Promise<RendererExitReason>;
  private topStars: Star[] = [];
  private bottomStars: Star[] = [];
  private sideStars: Star[] = [];
  private topMeteors: Meteor[] = [];
  private bottomMeteors: Meteor[] = [];
  private sideMeteors: Meteor[] = [];
  private cachedWidth = 0;
  private cachedHeight = 0;
  private meteorFrequency: number;
  private quote: ModernQuote;
  private bgTheme: BackgroundTheme;
  private marioState: MarioState | null = null;
  private tetrisState: TetrisState | null = null;
  private prevCells: Cell[][] = [];
  private prevTitle: string | null = null;
  private titleSaved = false;
  private isFirstFrame = true;
  private seedTop: number;
  private seedBottom: number;
  private seedSide: number;
  private onInterrupt: () => void;
  private readonly handleState = (newState: OrchestratorState) => {
    this.state = { ...newState, iterations: [...newState.iterations] };
    this.updateTerminalTitle();
  };
  private readonly handleStopped = () => {
    this.stop("stopped");
  };

  constructor(
    orchestrator: Orchestrator,
    prompt: string,
    agentName: string,
    onInterrupt: () => void,
    options: RendererOptions = {},
  ) {
    this.orchestrator = orchestrator;
    this.prompt = prompt;
    this.agentName = agentName;
    this.onInterrupt = onInterrupt;
    this.meteorFrequency = Math.max(
      0,
      Math.floor(options.meteorFrequency ?? DEFAULT_METEOR_FREQUENCY),
    );
    this.quote = selectModernQuote();
    this.bgTheme = options.backgroundTheme ?? selectBackgroundTheme();
    this.state = orchestrator.getState();
    this.seedTop = Math.floor(Math.random() * 2147483646) + 1;
    this.seedBottom = Math.floor(Math.random() * 2147483646) + 1;
    this.seedSide = Math.floor(Math.random() * 2147483646) + 1;
    this.exitPromise = new Promise((resolve) => {
      this.exitResolve = resolve;
    });
  }

  start(): void {
    this.orchestrator.on("state", this.handleState);

    this.orchestrator.on("stopped", this.handleStopped);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", (data) => {
        if (data[0] === 3) {
          this.onInterrupt();
        }
      });
    }

    this.interval = setInterval(() => this.render(), TICK_MS);
    this.render();
  }

  stop(reason: RendererExitReason = "stopped"): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.orchestrator.off("state", this.handleState);
    this.orchestrator.off("stopped", this.handleStopped);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners("data");
    }
    if (this.titleSaved) {
      // Clear the custom title first, then attempt the xterm stack restore.
      // Many modern terminals (iTerm2, macOS Terminal, Alacritty, Ghostty)
      // ignore the title save/restore stack, so without the explicit clear
      // our "animo · ..." title would persist after exit.
      process.stdout.write(emitTerminalTitle("") + restoreTerminalTitle());
      this.titleSaved = false;
      this.prevTitle = null;
    }
    this.exitResolve(reason);
  }

  waitUntilExit(): Promise<RendererExitReason> {
    return this.exitPromise;
  }

  private ensureStarFields(w: number, h: number): boolean {
    if (w !== this.cachedWidth || h !== this.cachedHeight) {
      this.cachedWidth = w;
      this.cachedHeight = h;
      const contentStart = Math.max(0, Math.floor((w - CONTENT_WIDTH) / 2) - 8);
      const contentEnd = contentStart + CONTENT_WIDTH + 16;
      const availableHeight = Math.max(0, h - 2);
      const remaining = Math.max(0, availableHeight - BASE_CONTENT_ROWS);
      const topHeight = Math.max(0, Math.ceil(remaining / 2));
      const bottomHeight = Math.max(0, remaining - topHeight);
      const proximityRows = 8;
      const shrinkBig = (s: Star, nearContentRow: boolean): Star => {
        if (!nearContentRow || s.x < contentStart || s.x >= contentEnd)
          return s;
        const star = s.char !== "·" ? { ...s, char: "·" } : s;
        return star.rest === "bright" ? { ...star, rest: "dim" } : star;
      };
      this.topStars = generateStarField(w, h, STAR_DENSITY, this.seedTop).map(
        (s) => shrinkBig(s, s.y >= topHeight - proximityRows),
      );
      this.bottomStars = generateStarField(
        w,
        h,
        STAR_DENSITY,
        this.seedBottom,
      ).map((s) => shrinkBig(s, s.y < proximityRows));
      this.sideStars = generateStarField(
        w,
        Math.max(BASE_CONTENT_ROWS, availableHeight),
        STAR_DENSITY,
        this.seedSide,
      );
      const sideWidth = Math.max(0, Math.floor((w - CONTENT_WIDTH) / 2));
      this.sideMeteors = generateSideMeteorShower(
        w,
        sideWidth,
        Math.min(BASE_CONTENT_ROWS, availableHeight),
        meteorCountForFrequency(this.meteorFrequency),
        this.seedSide + METEOR_SEED_OFFSET,
      );
      this.topMeteors = generateMeteorShower(
        w,
        topHeight,
        topHeight > 0 ? meteorCountForFrequency(this.meteorFrequency) : 0,
        this.seedTop + METEOR_SEED_OFFSET,
      );
      this.bottomMeteors = generateMeteorShower(
        w,
        bottomHeight,
        bottomHeight > 0 ? meteorCountForFrequency(this.meteorFrequency) : 0,
        this.seedBottom + METEOR_SEED_OFFSET,
      );
      if (this.bgTheme === "mario") {
        this.marioState = generateMarioBackground(
          w,
          availableHeight,
          this.seedTop,
        );
      } else if (this.bgTheme === "tetris") {
        this.tetrisState = generateTetrisBackground(
          w,
          availableHeight,
          this.seedTop,
        );
      }
      return true;
    }
    return false;
  }

  private render(): void {
    const now = Date.now();
    const w = process.stdout.columns || 80;
    const h = process.stdout.rows || 24;
    const resized = this.ensureStarFields(w, h);

    this.updateTerminalTitle(now);

    const nextCells = buildFrameCells(
      this.prompt,
      this.agentName,
      this.state,
      this.topStars,
      this.bottomStars,
      this.sideStars,
      now,
      w,
      h,
      this.topMeteors,
      this.bottomMeteors,
      this.sideMeteors,
      this.quote,
      undefined,
      this.bgTheme,
      this.marioState,
      this.tetrisState,
    );

    if (this.isFirstFrame || resized) {
      process.stdout.write("\x1b[H" + nextCells.map(rowToString).join("\n"));
      this.isFirstFrame = false;
    } else {
      const changes = diffFrames(this.prevCells, nextCells);
      if (changes.length > 0) {
        process.stdout.write(emitDiff(changes));
      }
    }

    this.prevCells = nextCells;
  }

  private updateTerminalTitle(now = Date.now()): void {
    if (!process.stdout.isTTY) {
      return;
    }
    const nextTitle = buildTerminalTitle(this.state, now);
    if (!this.titleSaved) {
      process.stdout.write(saveTerminalTitle());
      this.titleSaved = true;
    }
    if (nextTitle === this.prevTitle) {
      return;
    }
    process.stdout.write(emitTerminalTitle(nextTitle));
    this.prevTitle = nextTitle;
  }
}
