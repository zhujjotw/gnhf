import type { Orchestrator, OrchestratorState, IterationRecord } from "./orchestrator.js";
import type { EmailConfig } from "./config.js";
import type { StatusData } from "./status.js";
import { sendEmail } from "./email.js";
import { buildStatusEmailHtml } from "./email-template.js";
import { appendDebugLog } from "./debug-log.js";

export class EmailScheduler {
  private config: EmailConfig;
  private status: StatusData;
  private iterations: IterationRecord[] = [];
  private intervalMs: number;
  private lastSendTime = 0;
  private disposed = false;

  constructor(config: EmailConfig, status: StatusData) {
    this.config = config;
    this.status = status;
    this.intervalMs = config.intervalMinutes * 60 * 1000;
  }

  attach(orchestrator: Orchestrator): void {
    orchestrator.on("state", (state) => this.onStateUpdate(state));
    orchestrator.on("iteration:end", (record) => {
      this.iterations.push(record);
    });
    orchestrator.on("stopped", () => this.sendFinal("stopped"));
    orchestrator.on("abort", () => this.sendFinal("aborted"));
  }

  private onStateUpdate(state: OrchestratorState): void {
    this.status = {
      ...this.status,
      status: state.status,
      currentIteration: state.currentIteration,
      successCount: state.successCount,
      failCount: state.failCount,
      totalInputTokens: state.totalInputTokens,
      totalOutputTokens: state.totalOutputTokens,
      commitCount: state.commitCount,
      lastUpdateTime: new Date().toISOString(),
    };

    const now = Date.now();
    if (now - this.lastSendTime >= this.intervalMs && state.currentIteration > 0) {
      this.sendPeriodic().catch((err) => {
        appendDebugLog("email:scheduler:error", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }

  private async sendPeriodic(): Promise<void> {
    if (this.disposed) return;
    this.lastSendTime = Date.now();

    try {
      await sendEmail(this.config, {
        to: this.config.to,
        subject: `[animo] ${this.status.branch} - iteration ${this.status.currentIteration}`,
        html: buildStatusEmailHtml({
          status: this.status,
          iterations: this.iterations,
        }),
      });
      appendDebugLog("email:sent", {
        type: "periodic",
        iteration: this.status.currentIteration,
        to: this.config.to,
      });
    } catch (err) {
      appendDebugLog("email:send-error", {
        type: "periodic",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async sendFinal(
    finalStatus: "stopped" | "aborted",
  ): Promise<void> {
    if (this.disposed) return;

    const finalStatusData: StatusData = {
      ...this.status,
      status: finalStatus,
      pid: 0,
      lastUpdateTime: new Date().toISOString(),
    };

    try {
      await sendEmail(this.config, {
        to: this.config.to,
        subject: `[animo] ${this.status.branch} - ${finalStatus}`,
        html: buildStatusEmailHtml({
          status: finalStatusData,
          iterations: this.iterations,
        }),
      });
      appendDebugLog("email:sent", {
        type: "final",
        status: finalStatus,
        to: this.config.to,
      });
    } catch (err) {
      appendDebugLog("email:send-error", {
        type: "final",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  dispose(): void {
    this.disposed = true;
  }
}
