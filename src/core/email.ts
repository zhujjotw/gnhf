import { SMTPClient, Message } from "emailjs";
import type { MessageHeaders } from "emailjs";

export interface EmailConfig {
  enabled: boolean;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  to: string;
  intervalMinutes: number;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(
  config: EmailConfig,
  options: SendEmailOptions,
): Promise<void> {
  const client = new SMTPClient({
    host: config.smtp.host,
    port: config.smtp.port,
    user: config.smtp.user,
    password: config.smtp.password,
    ssl: config.smtp.port === 465,
    tls: config.smtp.port === 587,
    timeout: 30_000,
  });

  const message = new Message({
    from: options.from ?? config.smtp.user,
    to: options.to,
    subject: options.subject,
    attachment: [{ data: options.html, alternative: true }],
  });

  await client.sendAsync(message as unknown as MessageHeaders);
}
