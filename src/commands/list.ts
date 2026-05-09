import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  readStatusFile,
  resolveDisplayStatus,
  type StatusData,
} from "../core/status.js";

interface ListOptions {
  all: boolean;
  cwd: string;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

function formatElapsed(startTime: string): string {
  const ms = Date.now() - new Date(startTime).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return remainMinutes > 0 ? `${hours}h${remainMinutes}m` : `${hours}h`;
}

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + "\u2026";
}

function padRight(s: string, len: number): string {
  return s.length >= len ? s : s + " ".repeat(len - s.length);
}

function padLeft(s: string, len: number): string {
  return s.length >= len ? s : " ".repeat(len - s.length) + s;
}

interface TaskEntry {
  runId: string;
  status: StatusData;
  displayStatus: StatusData["status"];
}

export function listTasks(options: ListOptions): void {
  const runsDir = join(options.cwd, ".animo", "runs");
  if (!existsSync(runsDir)) {
    console.error("  No .animo/runs/ directory found.");
    return;
  }

  const entries: TaskEntry[] = [];
  const dirs = readdirSync(runsDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const status = readStatusFile(join(runsDir, dir.name));
    if (!status) continue;
    entries.push({
      runId: dir.name,
      status,
      displayStatus: resolveDisplayStatus(status),
    });
  }

  if (entries.length === 0) {
    console.error("  No animo tasks found.");
    return;
  }

  entries.sort(
    (a, b) =>
      new Date(b.status.lastUpdateTime).getTime() -
      new Date(a.status.lastUpdateTime).getTime(),
  );

  const displayed = options.all ? entries : entries.slice(0, 10);

  const idWidth = Math.max(4, ...displayed.map((e) => e.runId.length)) + 2;
  const branchWidth =
    Math.max(6, ...displayed.map((e) => e.status.branch.length)) + 2;
  const agentWidth =
    Math.max(5, ...displayed.map((e) => e.status.agent.length)) + 2;

  const header =
    padRight("ID", idWidth) +
    padRight("BRANCH", branchWidth) +
    padRight("AGENT", agentWidth) +
    padRight("STATUS", 10) +
    padRight("ITER", 8) +
    padRight("COMMITS", 9) +
    padRight("TOKENS", 10) +
    "TIME";

  const lines = displayed.map((e) => {
    const s = e.status;
    const iterDisplay = `${s.currentIteration}`;
    return (
      padRight(truncate(e.runId, idWidth - 1), idWidth) +
      padRight(truncate(s.branch, branchWidth - 1), branchWidth) +
      padRight(s.agent, agentWidth) +
      padRight(e.displayStatus, 10) +
      padRight(iterDisplay, 8) +
      padLeft(String(s.commitCount), 7) +
      "  " +
      padRight(formatTokens(s.totalInputTokens + s.totalOutputTokens), 8) +
      formatElapsed(s.startTime)
    );
  });

  console.log("");
  console.log(`  ${header}`);
  for (const line of lines) {
    console.log(`  ${line}`);
  }

  const running = entries.filter((e) => e.displayStatus === "running").length;
  const stopped = entries.filter((e) => e.displayStatus === "stopped").length;
  const aborted = entries.filter((e) => e.displayStatus === "aborted").length;
  const crashed = entries.filter((e) => e.displayStatus === "crashed").length;

  const parts: string[] = [];
  if (running > 0) parts.push(`${running} running`);
  if (stopped > 0) parts.push(`${stopped} stopped`);
  if (aborted > 0) parts.push(`${aborted} aborted`);
  if (crashed > 0) parts.push(`${crashed} crashed`);

  console.log("");
  console.log(
    `  ${entries.length} task${entries.length === 1 ? "" : "s"}${parts.length > 0 ? ` (${parts.join(", ")})` : ""}`,
  );
  if (!options.all && entries.length > 10) {
    console.log(`  Showing 10 of ${entries.length}. Use --all to show all.`);
  }
  console.log("");
}
