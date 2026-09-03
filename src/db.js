import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';

if (!existsSync('./data')) mkdirSync('./data');
const db = new Database('./data/emails.sqlite');

// Enable WAL mode for smooth concurrent reads and writes
db.pragma('journal_mode = WAL');

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
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
  CREATE INDEX IF NOT EXISTS idx_emails_urgency ON emails(urgency);
`);

export const emailDb = {
  exists: (id) => !!db.prepare('SELECT 1 FROM emails WHERE id = ?').get(id),
  getById: (id) => db.prepare('SELECT * FROM emails WHERE id = ?').get(id),
  
  upsertRaw: (email) => {
    const stmt = db.prepare(`
      INSERT INTO emails (id, sender, subject, date, body, status)
      VALUES (@id, @sender, @subject, @date, @body, 'PENDING')
      ON CONFLICT(id) DO UPDATE SET
        sender = excluded.sender,
        subject = excluded.subject,
        date = excluded.date,
        body = excluded.body
    `);
    return stmt.run(email);
  },

  updateTriage: (id, { category, urgency, tldr, status = 'COMPLETED' }) => {
    return db.prepare(`
      UPDATE emails 
      SET category = ?, urgency = ?, tldr = ?, status = ?
      WHERE id = ?
    `).run(category, urgency, tldr, status, id);
  },

  markPending: (limit = null) => {
    if (limit) {
      return db.prepare(`
        UPDATE emails 
        SET status = 'PENDING' 
        WHERE id IN (SELECT id FROM emails ORDER BY date DESC LIMIT ?)
      `).run(limit);
    }
    return db.prepare("UPDATE emails SET status = 'PENDING'").run();
  },

  updateReply: (id, reply) => {
    return db.prepare('UPDATE emails SET suggested_reply = ? WHERE id = ?').run(reply, id);
  },

  getAll: (urgency = null) => {
    if (urgency && urgency !== 'ALL') {
      return db.prepare('SELECT * FROM emails WHERE urgency = ? ORDER BY date DESC').all(urgency);
    }
    return db.prepare('SELECT * FROM emails ORDER BY date DESC').all();
  },

  getQueueStats: () => {
    const total = db.prepare('SELECT COUNT(*) as count FROM emails').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'PENDING'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'COMPLETED'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM emails WHERE status = 'FAILED'").get().count;
    return { total, pending, completed, failed };
  },

  getNextPendingBatch: (limit = 100) => {
    return db.prepare("SELECT * FROM emails WHERE status = 'PENDING' ORDER BY date DESC LIMIT ?").all(limit);
  },

  clearAll: () => db.prepare('DELETE FROM emails').run()
};