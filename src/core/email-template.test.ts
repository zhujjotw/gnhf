import { describe, it, expect } from "vitest";
import { buildStatusEmailHtml } from "./email-template.js";
import type { StatusData } from "./status.js";
import type { IterationRecord } from "./orchestrator.js";

function makeStatus(overrides: Partial<StatusData> = {}): StatusData {
  return {
    pid: process.pid,
    branch: "animo/fix-auth",
    agent: "claude",
    status: "running",
    prompt: "fix the authentication bug in the login flow",
    startTime: new Date(Date.now() - 900_000).toISOString(),
    lastUpdateTime: new Date().toISOString(),
    currentIteration: 5,
    successCount: 4,
    failCount: 1,
    totalInputTokens: 15000,
    totalOutputTokens: 8000,
    commitCount: 3,
    ...overrides,
  };
}

function makeIteration(overrides: Partial<IterationRecord> = {}): IterationRecord {
  return {
    number: 1,
    success: true,
    summary: "Fixed login bug",
    keyChanges: ["Updated auth.ts"],
    keyLearnings: [],
    timestamp: new Date(),
    ...overrides,
  };
}

describe("email-template", () => {
  it("produces valid HTML with doctype", () => {
    const html = buildStatusEmailHtml({
      status: makeStatus(),
      iterations: [],
    });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes task overview fields", () => {
    const html = buildStatusEmailHtml({
      status: makeStatus(),
      iterations: [],
    });
    expect(html).toContain("animo/fix-auth");
    expect(html).toContain("claude");
    expect(html).toContain("fix the authentication bug");
  });

  it("includes runtime stats", () => {
    const html = buildStatusEmailHtml({
      status: makeStatus(),
      iterations: [],
    });
    expect(html).toContain("Iterations");
    expect(html).toContain("Success");
    expect(html).toContain("Failed");
    expect(html).toContain("Commits");
    expect(html).toContain("Tokens");
  });

  it("includes status badge", () => {
    const html = buildStatusEmailHtml({
      status: makeStatus({ status: "stopped" }),
      iterations: [],
    });
    expect(html).toContain("STOPPED");
  });

  it("includes iteration history when iterations exist", () => {
    const iterations = [
      makeIteration({ number: 1, success: true, summary: "First fix" }),
      makeIteration({ number: 2, success: false, summary: "Failed attempt" }),
    ];
    const html = buildStatusEmailHtml({
      status: makeStatus(),
      iterations,
    });
    expect(html).toContain("Iteration History");
    expect(html).toContain("First fix");
    expect(html).toContain("Failed attempt");
    expect(html).toContain("OK");
    expect(html).toContain("FAIL");
  });

  it("includes latest iteration summary", () => {
    const iterations = [
      makeIteration({ summary: "Latest changes applied" }),
    ];
    const html = buildStatusEmailHtml({
      status: makeStatus(),
      iterations,
    });
    expect(html).toContain("Latest Iteration");
    expect(html).toContain("Latest changes applied");
  });

  it("escapes HTML in user content", () => {
    const html = buildStatusEmailHtml({
      status: makeStatus({
        prompt: '<script>alert("xss")</script>',
        branch: "animo/<b>bold</b>",
      }),
      iterations: [],
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>bold</b>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("includes mobile-friendly viewport meta tag", () => {
    const html = buildStatusEmailHtml({
      status: makeStatus(),
      iterations: [],
    });
    expect(html).toContain('name="viewport"');
    expect(html).toContain("width=device-width");
  });
});
