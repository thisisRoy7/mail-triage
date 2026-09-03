import { fetchEmails } from './imap.js';
import { analyzeEmail } from './llm.js';
import { emailDb } from './db.js';

class TriageQueueManager {
  constructor() {
    this.isRunning = false;
    this.currentEmail = null;
    this.lastActiveTime = Date.now();
    this.subscribers = new Set();
  }

  subscribe(res) {
    this.subscribers.add(res);
    res.on('close', () => this.subscribers.delete(res));
    this.broadcastState();
  }

  broadcastState() {
    const stats = emailDb.getQueueStats();
    const progressPct = stats.total > 0 
      ? Math.round(((stats.completed + stats.failed) / stats.total) * 100) 
      : 0;

    const isStalled = this.isRunning && (Date.now() - this.lastActiveTime > 45000);

    const payload = {
      isRunning: this.isRunning,
      isStalled,
      currentEmail: this.currentEmail,
      stats,
      progressPct
    };

    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of this.subscribers) {
      res.write(data);
    }
  }

  async runQueue() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.broadcastState();

    try {
      while (true) {
        const pendingEmails = emailDb.getNextPendingBatch(20);
        if (pendingEmails.length === 0) break;

        for (const mail of pendingEmails) {
          this.currentEmail = { id: mail.id, subject: mail.subject, sender: mail.sender };
          this.lastActiveTime = Date.now();
          this.broadcastState();

          try {
            const analysis = await analyzeEmail(mail);
            emailDb.updateTriage(mail.id, {
              category: analysis.category,
              urgency: analysis.urgency,
              tldr: analysis.tldr,
              status: 'COMPLETED'
            });
          } catch (err) {
            console.error(`Error triaging email ${mail.id}:`, err);
            emailDb.updateTriage(mail.id, {
              category: 'FYI',
              urgency: 'LOW',
              tldr: 'Analysis failed.',
              status: 'FAILED'
            });
          }

          this.lastActiveTime = Date.now();
          this.broadcastState();
        }
      }
    } finally {
      this.isRunning = false;
      this.currentEmail = null;
      this.broadcastState();
    }
  }

  async ingestAndTriage({ limit = null, resetScope = 'none' } = {}) {
    // 1. Ingest newly found emails into DB as PENDING immediately
    const fetched = await fetchEmails({ limit });
    for (const mail of fetched) {
      if (!emailDb.exists(mail.id)) {
        emailDb.upsertRaw(mail);
      }
    }

    // 2. Mark scope as PENDING based on reset type
    if (resetScope === 'soft') {
      emailDb.markPending(100);
    } else if (resetScope === 'full') {
      emailDb.markPending(null);
    }

    // 3. Trigger async worker without blocking HTTP response
    this.runQueue().catch(console.error);
    return { ingestedCount: fetched.length };
  }
}

export const triageQueue = new TriageQueueManager();