import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { config } from './config.js';

export async function fetchUnreadEmails(limit = 10) {
  const connection = await imaps.connect({ imap: config.gmail });
  await connection.openBox('INBOX');

  // Search unread messages
  const searchCriteria = ['UNSEEN'];
  const fetchOptions = { bodies: ['HEADER', ''], markSeen: false };
  const messages = await connection.search(searchCriteria, fetchOptions);

  const parsed = [];
  for (const item of messages.slice(-limit)) {
    const rawPart = item.parts.find((p) => p.which === '');
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