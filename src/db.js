import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';

if (!existsSync('./data')) mkdirSync('./data');
const db = new Database('./data/emails.sqlite');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    sender TEXT,
    subject TEXT,
    date TEXT,
    body TEXT,
    category TEXT,
    urgency TEXT,
    tldr TEXT,
    suggested_reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const emailDb = {
  exists: (id) => !!db.prepare('SELECT 1 FROM emails WHERE id = ?').get(id),
  getById: (id) => db.prepare('SELECT * FROM emails WHERE id = ?').get(id),
  insert: (email) => {
    const stmt = db.prepare(`
      INSERT INTO emails (id, sender, subject, date, body, category, urgency, tldr, suggested_reply)
      VALUES (@id, @sender, @subject, @date, @body, @category, @urgency, @tldr, @suggested_reply)
    `);
    return stmt.run(email);
  },
  updateReply: (id, reply) => {
    return db.prepare('UPDATE emails SET suggested_reply = ? WHERE id = ?').run(reply, id);
  },
  getAll: () => db.prepare('SELECT * FROM emails ORDER BY created_at DESC').all(),
  clearAll: () => db.prepare('DELETE FROM emails').run()
};