import express from 'express';
import { emailDb } from './db.js';
import { triageQueue } from './triage.js';
import { generateReply } from './llm.js';
import { config } from './config.js';

const app = express();
app.use(express.static('public'));
app.use(express.json());

// Server-Sent Events stream for queue progress and health
app.get('/api/progress/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  triageQueue.subscribe(res);
});

// Email list with optional urgency filter
app.get('/api/emails', (req, res) => {
  const { urgency } = req.query;
  res.json(emailDb.getAll(urgency));
});

// Incremental sync
app.post('/api/sync', async (req, res) => {
  try {
    const result = await triageQueue.ingestAndTriage({ resetScope: 'none' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Soft Reset: Pull latest, re-triage top 100
app.post('/api/reset/soft', async (req, res) => {
  try {
    const result = await triageQueue.ingestAndTriage({ limit: 100, resetScope: 'soft' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full Reset: Pull all, re-triage entire DB
app.post('/api/reset/full', async (req, res) => {
  try {
    const result = await triageQueue.ingestAndTriage({ limit: null, resetScope: 'full' });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hard clear database
app.post('/api/clear', (req, res) => {
  try {
    emailDb.clearAll();
    res.json({ success: true, message: 'All local emails wiped.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/emails/:id/draft', async (req, res) => {
  try {
    const email = emailDb.getById(req.params.id);
    if (!email) return res.status(404).json({ error: 'Email not found' });

    const reply = await generateReply(email);
    emailDb.updateReply(email.id, reply);
    res.json({ suggested_reply: reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`Client running at http://localhost:${config.port}`);
});