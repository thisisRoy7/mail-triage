import { fetchEmails } from './imap.js';
import { analyzeEmail } from './llm.js';
import { emailDb } from './db.js';
import { logger } from './logger.js';

class TriageQueueManager {
  constructor() {
    this.isRunning = false;
    this.isIngesting = false;
    this.abortRequested = false;
    this.currentEmail = null;
    this.lastActiveTime = Date.now();
    this.subscribers = new Set();
  }

  subscribe(res) {
    this.subscribers.add(res);
    logger.debug('QUEUE', `New client subscribed to SSE stream. Total subscribers: ${this.subscribers.size}`);
    res.on('close', () => {
      this.subscribers.delete(res);
      logger.debug('QUEUE', `Client disconnected from SSE stream. Total subscribers: ${this.subscribers.size}`);
    });
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
      isIngesting: this.isIngesting,
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

  async stopCurrentRun() {
    if (!this.isRunning) return;
    logger.warn('QUEUE', 'Stopping current queue execution before reset...');
    this.abortRequested = true;

    while (this.isRunning) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.abortRequested = false;
    logger.info('QUEUE', 'Previous queue worker successfully stopped');
  }

  async runQueue() {
    if (this.isRunning) {
      logger.warn('QUEUE', 'runQueue requested but worker is already running');
      return;
    }
    
    this.isRunning = true;
    this.abortRequested = false;
    logger.info('QUEUE', 'Background triage queue worker started');
    this.broadcastState();

    const CONCURRENCY = 4;

    try {
      while (true) {
        if (this.abortRequested) {
          logger.warn('QUEUE', 'Abort detected in queue worker. Halting loop.');
          break;
        }

        const pendingEmails = emailDb.getNextPendingBatch(20);
        if (pendingEmails.length === 0) {
          logger.info('QUEUE', 'No more pending emails in SQLite. Queue run complete.');
          break;
        }

        logger.info('QUEUE', `Retrieved ${pendingEmails.length} pending emails for triage`);

        for (let i = 0; i < pendingEmails.length; i += CONCURRENCY) {
          if (this.abortRequested) {
            logger.warn('QUEUE', 'Abort detected mid-batch. Halting chunk processing.');
            break;
          }

          const chunk = pendingEmails.slice(i, i + CONCURRENCY);
          logger.debug('QUEUE', `Processing batch chunk of size ${chunk.length}`);

          await Promise.all(
            chunk.map(async (mail) => {
              if (this.abortRequested) return;

              this.currentEmail = { id: mail.id, subject: mail.subject, sender: mail.sender };
              this.lastActiveTime = Date.now();
              this.broadcastState();

              try {
                const analysis = await analyzeEmail(mail);
                if (this.abortRequested) return;

                emailDb.updateTriage(mail.id, {
                  category: analysis.category,
                  urgency: analysis.urgency,
                  tldr: analysis.tldr,
                  status: 'COMPLETED'
                });
              } catch (err) {
                logger.error('QUEUE', `Unhandled error processing email [id=${mail.id}]`, err);
                if (!this.abortRequested) {
                  emailDb.updateTriage(mail.id, {
                    category: 'FYI',
                    urgency: 'LOW',
                    tldr: 'Analysis failed.',
                    status: 'FAILED'
                  });
                }
              }
            })
          );

          this.lastActiveTime = Date.now();
          this.broadcastState();
        }
      }
    } catch (queueErr) {
      logger.error('QUEUE', 'Fatal crash in triage queue loop', queueErr);
    } finally {
      this.isRunning = false;
      this.currentEmail = null;
      logger.info('QUEUE', 'Background triage queue worker stopped');
      this.broadcastState();
    }
  }

  async ingestAndTriage({ limit = null, resetScope = 'none' } = {}) {
    if (this.isIngesting) {
      throw new Error('An ingestion/sync operation is already in progress.');
    }

    this.isIngesting = true;
    logger.info('QUEUE', `ingestAndTriage triggered (limit=${limit}, resetScope=${resetScope})`);
    this.broadcastState();

    try {
      if (resetScope !== 'none') {
        await this.stopCurrentRun();
      }

      const sinceUid = resetScope === 'none' ? emailDb.getMaxId() : null;
      const fetched = await fetchEmails({ limit, sinceUid });
      let insertedCount = 0;

      for (const mail of fetched) {
        if (!emailDb.exists(mail.id)) {
          emailDb.upsertRaw(mail);
          insertedCount++;
        }
      }

      logger.info('QUEUE', `Ingestion finished: ${insertedCount} new emails saved out of ${fetched.length} fetched`);

      if (resetScope === 'soft') {
        emailDb.markPending(100);
      } else if (resetScope === 'full') {
        emailDb.markPending(null);
      }

      this.runQueue().catch((err) => {
        logger.error('QUEUE', 'Async queue trigger failed', err);
      });

      return { ingestedCount: fetched.length, newEmails: insertedCount };
    } finally {
      this.isIngesting = false;
      this.broadcastState();
    }
  }
}

export const triageQueue = new TriageQueueManager();