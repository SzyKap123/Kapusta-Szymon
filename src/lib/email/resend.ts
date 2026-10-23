// Wysyłka e-maili przez Resend (REST API).

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export interface Mailer {
  send(msg: EmailMessage): Promise<void>;
  /** Wysyłka wielu wiadomości (każdy odbiorca dostaje osobny e-mail). */
  sendBatch(msgs: EmailMessage[]): Promise<void>;
}

export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async post(path: string, body: unknown) {
    const res = await this.fetchImpl(`https://api.resend.com${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Resend ${path}: HTTP ${res.status} ${await res.text()}`);
  }

  async send(msg: EmailMessage) {
    await this.post("/emails", { from: this.from, ...msg });
  }

  async sendBatch(msgs: EmailMessage[]) {
    for (let i = 0; i < msgs.length; i += 100) {
      await this.post(
        "/emails/batch",
        msgs.slice(i, i + 100).map((m) => ({ from: this.from, ...m })),
      );
    }
  }
}

/** Gdy brak klucza Resend — tylko wypisuje do logów. */
export class ConsoleMailer implements Mailer {
  sent: EmailMessage[] = [];
  async send(msg: EmailMessage) {
    this.sent.push(msg);
    console.log(`[e-mail] do: ${msg.to} | ${msg.subject}`);
  }
  async sendBatch(msgs: EmailMessage[]) {
    for (const m of msgs) await this.send(m);
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
