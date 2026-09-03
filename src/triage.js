import { fetchUnreadEmails } from './imap.js';
import { analyzeEmail } from './llm.js';
import { emailDb } from './db.js';

export async function syncAndTriage() {
  const rawEmails = await fetchUnreadEmails(5);
  const results = [];

  for (const mail of rawEmails) {
    if (emailDb.exists(mail.id)) continue;

    const analysis = await analyzeEmail(mail);
    const fullRecord = {
      ...mail,
      category: analysis.category,
      urgency: analysis.urgency,
      tldr: analysis.tldr,
      suggested_reply: analysis.suggested_reply
    };

    emailDb.insert(fullRecord);
    results.push(fullRecord);
  }

  return results;
}