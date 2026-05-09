import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface StatusData {
  pid: number;
  branch: string;
  agent: string;
  status: "running" | "waiting" | "stopped" | "aborted" | "crashed";
  prompt: string;
  startTime: string;
  lastUpdateTime: string;
  currentIteration: number;
  successCount: number;
  failCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  commitCount: number;
}

const STATUS_FILENAME = "status.json";

export function statusFilePath(runDir: string): string {
  return join(runDir, STATUS_FILENAME);
}

export function writeStatusFile(
  runDir: string,
  data: StatusData,
): void {
  const path = statusFilePath(runDir);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

export function readStatusFile(runDir: string): StatusData | null {
  const path = statusFilePath(runDir);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as StatusData;
  } catch {
    return null;
  }
}

export function clearStatusPid(runDir: string, finalStatus: "stopped" | "aborted"): void {
  const data = readStatusFile(runDir);
  if (!data) return;
  data.pid = 0;
  data.status = finalStatus;
  data.lastUpdateTime = new Date().toISOString();
  writeStatusFile(runDir, data);
}

export function isProcessAlive(pid: number): boolean {
  if (pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function resolveDisplayStatus(data: StatusData): StatusData["status"] {
  if ((data.status === "running" || data.status === "waiting") && !isProcessAlive(data.pid)) {
    return "crashed";
  }
  return data.status;
}
