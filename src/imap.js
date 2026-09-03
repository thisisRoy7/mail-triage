import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { config } from './config.js';

export async function fetchEmails({ limit = null } = {}) {
  const connection = await imaps.connect({ imap: config.gmail });
  await connection.openBox('INBOX');

  // Fetch all messages (read and unread)
  const searchCriteria = ['ALL'];
  const fetchOptions = { bodies: ['HEADER', ''], markSeen: false };
  const rawResults = await connection.search(searchCriteria, fetchOptions);

  // Take latest 'limit' if specified, or all
  const targetMessages = limit ? rawResults.slice(-limit) : rawResults;
  const parsed = [];

  for (const item of targetMessages) {
    const rawPart = item.parts.find((p) => p.which === '');
    if (!rawPart) continue;

    const mail = await simpleParser(rawPart.body);
    parsed.push({
      id: item.attributes.uid.toString(),
      sender: mail.from?.text || 'Unknown',
      subject: mail.subject || '(No Subject)',
      date: mail.date ? mail.date.toISOString() : new Date().toISOString(),
      body: mail.text || mail.html?.replace(/<[^>]*>?/gm, '') || ''
    });
  }

  await connection.end();
  return parsed;
}