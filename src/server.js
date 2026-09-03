import express from 'express';
import { emailDb } from './db.js';
import { syncAndTriage } from './triage.js';
import { config } from './config.js';

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.get('/api/emails', (req, res) => {
  res.json(emailDb.getAll());
});

app.post('/api/sync', async (req, res) => {
  try {
    const newItems = await syncAndTriage();
    res.json({ success: true, count: newItems.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(config.port, () => {
  console.log(`Client running at http://localhost:${config.port}`);
});