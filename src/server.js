import express from 'express';
import { emailDb } from './db.js';
import { triageQueue } from './triage.js';
import { streamReply } from './llm.js';
import { config } from './config.js';
import { logger } from './logger.js';

const app = express();
app.use(express.static('public'));
app.use(express.json());

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

  // Send periodic comment frame to prevent proxy/browser read timeouts
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

// Email list with optional urgency filter
app.get('/api/emails', (req, res) => {
  const { urgency } = req.query;
  const emails = emailDb.getAll(urgency);
  logger.info('HTTP', `Fetched ${emails.length} emails (urgency=${urgency || 'ALL'})`);
  res.json(emails);
});

// Incremental sync
app.post('/api/sync', async (req, res) => {
  logger.info('HTTP', 'Received POST /api/sync');
  try {
    const result = await triageQueue.ingestAndTriage({ resetScope: 'none' });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('HTTP', 'POST /api/sync failed', err);
    const statusCode = err.message.includes('already in progress') ? 409 : 500;
    res.status(statusCode).json({ error: err.message });
  }
});

// Soft Reset: Pull latest, re-triage top 100
app.post('/api/reset/soft', async (req, res) => {
  logger.info('HTTP', 'Received POST /api/reset/soft');
  try {
    const result = await triageQueue.ingestAndTriage({ limit: 100, resetScope: 'soft' });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('HTTP', 'POST /api/reset/soft failed', err);
    const statusCode = err.message.includes('already in progress') ? 409 : 500;
    res.status(statusCode).json({ error: err.message });
  }
});

// Full Reset: Pull all, re-triage entire DB
app.post('/api/reset/full', async (req, res) => {
  logger.info('HTTP', 'Received POST /api/reset/full');
  try {
    const result = await triageQueue.ingestAndTriage({ limit: null, resetScope: 'full' });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('HTTP', 'POST /api/reset/full failed', err);
    const statusCode = err.message.includes('already in progress') ? 409 : 500;
    res.status(statusCode).json({ error: err.message });
  }
});

// Hard clear database
app.post('/api/clear', async (req, res) => {
  logger.warn('HTTP', 'Received POST /api/clear');
  try {
    await triageQueue.stopCurrentRun();
    emailDb.clearAll();
    triageQueue.broadcastState();
    res.json({ success: true, message: 'All local emails wiped.' });
  } catch (err) {
    logger.error('HTTP', 'POST /api/clear failed', err);
    res.status(500).json({ error: err.message });
  }
});

// On-demand real-time streaming response generation
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

    emailDb.updateReply(email.id, completeText.trim());
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