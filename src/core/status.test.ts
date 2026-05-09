import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  writeStatusFile,
  readStatusFile,
  clearStatusPid,
  isProcessAlive,
  resolveDisplayStatus,
  statusFilePath,
  type StatusData,
} from "./status.js";

function makeStatus(overrides: Partial<StatusData> = {}): StatusData {
  return {
    pid: process.pid,
    branch: "animo/test",
    agent: "claude",
    status: "running",
    prompt: "test prompt",
    startTime: new Date().toISOString(),
    lastUpdateTime: new Date().toISOString(),
    currentIteration: 1,
    successCount: 0,
    failCount: 0,
    totalInputTokens: 100,
    totalOutputTokens: 50,
    commitCount: 0,
    ...overrides,
  };
}

describe("status", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "animo-status-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("writeStatusFile / readStatusFile", () => {
    it("round-trips status data", () => {
      const data = makeStatus();
      writeStatusFile(tmpDir, data);
      const read = readStatusFile(tmpDir);
      expect(read).toEqual(data);
    });

    it("creates the directory if it does not exist", () => {
      const subDir = join(tmpDir, "nested", "dir");
      const data = makeStatus();
      writeStatusFile(subDir, data);
      expect(existsSync(statusFilePath(subDir))).toBe(true);
      expect(readStatusFile(subDir)).toEqual(data);
    });

    it("returns null when no status file exists", () => {
      expect(readStatusFile(tmpDir)).toBeNull();
    });

    it("returns null on malformed JSON", () => {
      writeFileSync(statusFilePath(tmpDir), "not json", "utf-8");
      expect(readStatusFile(tmpDir)).toBeNull();
    });
  });

  describe("clearStatusPid", () => {
    it("sets pid to 0 and updates status", () => {
      const data = makeStatus({ pid: 12345 });
      writeStatusFile(tmpDir, data);
      clearStatusPid(tmpDir, "stopped");
      const read = readStatusFile(tmpDir)!;
      expect(read.pid).toBe(0);
      expect(read.status).toBe("stopped");
    });

    it("does nothing when no status file exists", () => {
      clearStatusPid(tmpDir, "aborted");
      expect(readStatusFile(tmpDir)).toBeNull();
    });
  });

  describe("isProcessAlive", () => {
    it("returns true for current process", () => {
      expect(isProcessAlive(process.pid)).toBe(true);
    });

    it("returns false for pid 0", () => {
      expect(isProcessAlive(0)).toBe(false);
    });

    it("returns false for negative pid", () => {
      expect(isProcessAlive(-1)).toBe(false);
    });

    it("returns false for non-existent pid", () => {
      expect(isProcessAlive(999999999)).toBe(false);
    });
  });

  describe("resolveDisplayStatus", () => {
    it("returns running when process is alive", () => {
      const data = makeStatus({ pid: process.pid, status: "running" });
      expect(resolveDisplayStatus(data)).toBe("running");
    });

    it("returns crashed when process is dead", () => {
      const data = makeStatus({ pid: 999999999, status: "running" });
      expect(resolveDisplayStatus(data)).toBe("crashed");
    });

    it("returns crashed for waiting status with dead process", () => {
      const data = makeStatus({ pid: 999999999, status: "waiting" });
      expect(resolveDisplayStatus(data)).toBe("crashed");
    });

    it("returns stopped without checking process", () => {
      const data = makeStatus({ pid: 0, status: "stopped" });
      expect(resolveDisplayStatus(data)).toBe("stopped");
    });

    it("returns aborted without checking process", () => {
      const data = makeStatus({ pid: 0, status: "aborted" });
      expect(resolveDisplayStatus(data)).toBe("aborted");
    });
  });
});
