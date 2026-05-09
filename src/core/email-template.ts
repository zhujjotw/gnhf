import type { StatusData } from "./status.js";
import type { IterationRecord } from "./orchestrator.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function statusColor(status: string): string {
  switch (status) {
    case "running":
      return "#2563eb";
    case "stopped":
      return "#16a34a";
    case "aborted":
      return "#ea580c";
    case "crashed":
      return "#dc2626";
    default:
      return "#6b7280";
  }
}

export interface EmailTemplateData {
  status: StatusData;
  iterations: IterationRecord[];
}

export function buildStatusEmailHtml(data: EmailTemplateData): string {
  const { status, iterations } = data;
  const totalTokens = status.totalInputTokens + status.totalOutputTokens;
  const elapsed = formatElapsed(status.startTime);

  const recentIterations = iterations.slice(-10);
  const lastIteration = iterations.at(-1);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:20px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

<!-- Header -->
<tr><td style="background:#18181b;padding:20px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:2px;">a n i m o</td>
    <td align="right">
      <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;color:#fff;background:${statusColor(status.status)};">${escapeHtml(status.status.toUpperCase())}</span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Task Overview -->
<tr><td style="padding:20px 24px;">
  <div style="font-size:14px;font-weight:600;color:#18181b;margin-bottom:12px;">Task Overview</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#3f3f46;">
    <tr><td style="padding:4px 0;color:#71717a;width:100px;">Run ID</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(status.branch)}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a;">Agent</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(status.agent)}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a;">Prompt</td><td style="padding:4px 0;font-weight:500;">${escapeHtml(status.prompt)}</td></tr>
    <tr><td style="padding:4px 0;color:#71717a;">Started</td><td style="padding:4px 0;font-weight:500;">${new Date(status.startTime).toLocaleString()}</td></tr>
  </table>
</td></tr>

<!-- Stats -->
<tr><td style="padding:0 24px 20px;">
  <div style="font-size:14px;font-weight:600;color:#18181b;margin-bottom:12px;">Runtime Stats</div>
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td width="25%" style="text-align:center;padding:12px 8px;background:#f9fafb;border-radius:6px;">
      <div style="font-size:24px;font-weight:700;color:#18181b;">${status.currentIteration}</div>
      <div style="font-size:11px;color:#71717a;margin-top:4px;">Iterations</div>
    </td>
    <td width="4%"></td>
    <td width="25%" style="text-align:center;padding:12px 8px;background:#f0fdf4;border-radius:6px;">
      <div style="font-size:24px;font-weight:700;color:#16a34a;">${status.successCount}</div>
      <div style="font-size:11px;color:#71717a;margin-top:4px;">Success</div>
    </td>
    <td width="4%"></td>
    <td width="25%" style="text-align:center;padding:12px 8px;background:#fef2f2;border-radius:6px;">
      <div style="font-size:24px;font-weight:700;color:#dc2626;">${status.failCount}</div>
      <div style="font-size:11px;color:#71717a;margin-top:4px;">Failed</div>
    </td>
    <td width="4%"></td>
    <td width="25%" style="text-align:center;padding:12px 8px;background:#f9fafb;border-radius:6px;">
      <div style="font-size:24px;font-weight:700;color:#18181b;">${status.commitCount}</div>
      <div style="font-size:11px;color:#71717a;margin-top:4px;">Commits</div>
    </td>
  </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:13px;">
    <tr>
      <td style="padding:8px 12px;background:#f9fafb;border-radius:6px;">
        <span style="color:#71717a;">Tokens: </span>
        <span style="font-weight:600;color:#18181b;">${formatTokens(totalTokens)}</span>
        <span style="color:#a1a1aa;font-size:11px;"> (in: ${formatTokens(status.totalInputTokens)} / out: ${formatTokens(status.totalOutputTokens)})</span>
      </td>
      <td width="12"></td>
      <td style="padding:8px 12px;background:#f9fafb;border-radius:6px;">
        <span style="color:#71717a;">Elapsed: </span>
        <span style="font-weight:600;color:#18181b;">${elapsed}</span>
      </td>
    </tr>
  </table>
</td></tr>

${
  lastIteration
    ? `<!-- Latest Iteration -->
<tr><td style="padding:0 24px 20px;">
  <div style="font-size:14px;font-weight:600;color:#18181b;margin-bottom:12px;">Latest Iteration #${lastIteration.number}</div>
  <div style="padding:12px;background:#f9fafb;border-radius:6px;border-left:3px solid ${lastIteration.success ? "#16a34a" : "#dc2626"};">
    <div style="font-size:13px;color:#18181b;line-height:1.5;">${escapeHtml(lastIteration.summary)}</div>
    ${
      lastIteration.keyChanges.length > 0
        ? `<div style="margin-top:8px;font-size:12px;color:#71717a;">Changes: ${lastIteration.keyChanges.map((c) => escapeHtml(c)).join(", ")}</div>`
        : ""
    }
  </div>
</td></tr>`
    : ""
}

${
  recentIterations.length > 0
    ? `<!-- Iteration History -->
<tr><td style="padding:0 24px 24px;">
  <div style="font-size:14px;font-weight:600;color:#18181b;margin-bottom:12px;">Iteration History</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border-collapse:collapse;">
    <tr style="background:#f9fafb;">
      <th style="padding:8px 12px;text-align:left;color:#71717a;font-weight:600;border-bottom:1px solid #e4e4e7;">#</th>
      <th style="padding:8px 12px;text-align:left;color:#71717a;font-weight:600;border-bottom:1px solid #e4e4e7;">Status</th>
      <th style="padding:8px 12px;text-align:left;color:#71717a;font-weight:600;border-bottom:1px solid #e4e4e7;">Summary</th>
    </tr>
    ${recentIterations
      .map(
        (it) => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f4f4f5;color:#18181b;font-weight:500;">${it.number}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f4f4f5;">
        <span style="color:${it.success ? "#16a34a" : "#dc2626"};">${it.success ? "OK" : "FAIL"}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f4f4f5;color:#3f3f46;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(it.summary)}</td>
    </tr>`,
      )
      .join("")}
  </table>
</td></tr>`
    : ""
}

<!-- Footer -->
<tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e4e4e7;">
  <div style="font-size:11px;color:#a1a1aa;text-align:center;">
    animo status notification &middot; ${new Date().toLocaleString()}
  </div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
