import express from 'express';
import { emailDb } from './db.js';
import { triageQueue } from './triage.js';
import { streamReply } from './llm.js';
import { config } from './config.js';
import { logger } from './logger.js';

const app = express();
app.use(express.static('public'));
app.use(express.json());

// Ephemeral in-memory store for active session drafts
const draftCache = new Map();

export function clearDraftCache() {
  const count = draftCache.size;
  draftCache.clear();
  logger.info('CACHE', `Cleared ${count} temporary in-memory drafts`);
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP', `${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  next();
});

// Server-Sent Events stream for queue progress and health
app.get('/api/progress/stream', (req, res) => {
  logger.info('HTTP', 'SSE connection opened on /api/progress/stream');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const keepAliveTimer = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAliveTimer);
    }
  }, 15000);

  res.on('close', () => {
    clearInterval(keepAliveTimer);
  });

  triageQueue.subscribe(res);
});

// Email list: returns lightweight metadata excluding heavy HTML payloads
app.get('/api/emails', (req, res) => {
  const { urgency } = req.query;
  const emails = emailDb.getAll(urgency);
  
  const emailsWithTempDrafts = emails.map(email => ({
    ...email,
    suggested_reply: draftCache.get(email.id) || null
  }));

  logger.info('HTTP', `Fetched ${emails.length} emails (urgency=${urgency || 'ALL'})`);
  res.json(emailsWithTempDrafts);
});

// On-demand fetch for full email HTML & rendered content
app.get('/api/emails/:id/content', (req, res) => {
  const { id } = req.params;
  const record = emailDb.getHtmlById(id);
  if (!record) {
    return res.status(404).json({ error: 'Email content not found' });
  }
  res.json(record);
});

// Incremental sync
app.post('/api/sync', (req, res) => {
  logger.info('HTTP', 'Received POST /api/sync');
  if (triageQueue.isIngesting) {
    return res.status(409).json({ error: 'A sync or ingestion operation is already active.' });
  }

  triageQueue.ingestAndTriage({ resetScope: 'none' }).catch((err) => {
    logger.error('HTTP', 'Background sync failed', err);
  });
  res.status(202).json({ accepted: true, message: 'Sync started in background.' });
});

// Soft Reset: Pull latest, re-triage top 100, wipe temp drafts
app.post('/api/reset/soft', (req, res) => {
  logger.info('HTTP', 'Received POST /api/reset/soft');
  if (triageQueue.isIngesting) {
    return res.status(409).json({ error: 'Cannot run soft reset while another operation is active.' });
  }

  clearDraftCache();
  triageQueue.ingestAndTriage({ limit: 100, resetScope: 'soft' }).catch((err) => {
    logger.error('HTTP', 'Background soft reset failed', err);
  });
  res.status(202).json({ accepted: true, message: 'Soft reset started in background.' });
});

// Full Reset: Pull all, re-triage entire DB, wipe temp drafts
app.post('/api/reset/full', (req, res) => {
  logger.info('HTTP', 'Received POST /api/reset/full');
  if (triageQueue.isIngesting) {
    return res.status(409).json({ error: 'Cannot run full reset while another operation is active.' });
  }

  clearDraftCache();
  triageQueue.ingestAndTriage({ limit: null, resetScope: 'full' }).catch((err) => {
    logger.error('HTTP', 'Background full reset failed', err);
  });
  res.status(202).json({ accepted: true, message: 'Full reset started in background.' });
});

// Hard clear database and wipe temp drafts
app.post('/api/clear', async (req, res) => {
  logger.warn('HTTP', 'Received POST /api/clear');
  try {
    await triageQueue.stopCurrentRun();
    clearDraftCache();
    emailDb.clearAll();
    triageQueue.broadcastState();
    res.json({ success: true, message: 'All local emails and temporary drafts wiped.' });
  } catch (err) {
    logger.error('HTTP', 'POST /api/clear failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Real-time on-demand streaming draft generation into memory
app.get('/api/emails/:id/draft/stream', async (req, res) => {
  const { id } = req.params;
  logger.info('HTTP', `Received draft stream request for email [id=${id}]`);

  const email = emailDb.getById(id);
  if (!email) {
    logger.warn('HTTP', `Draft stream 404: Email [id=${id}] not found in DB`);
    return res.status(404).end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    let completeText = '';
    await streamReply(email, (token) => {
      completeText += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    });

    draftCache.set(email.id, completeText.trim());
    logger.info('CACHE', `Saved ephemeral draft in-memory [id=${id}], length: ${completeText.length}`);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    logger.info('HTTP', `Completed draft streaming for email [id=${id}]`);
  } catch (err) {
    logger.error('HTTP', `Draft stream failed for email [id=${id}]`, err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

app.listen(config.port, () => {
  logger.info('SERVER', `Client running at http://localhost:${config.port}`);
});