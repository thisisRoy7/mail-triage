import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { convert } from 'html-to-text';
import { config } from './config.js';
import { logger } from './logger.js';

export async function fetchEmails({ limit = null } = {}) {
  logger.info('IMAP', `Initiating IMAP connection to ${config.gmail.host}:${config.gmail.port}`);
  
  let connection;
  try {
    connection = await imaps.connect({ imap: config.gmail });
    logger.info('IMAP', 'IMAP authenticated successfully');

    await connection.openBox('INBOX');
    logger.info('IMAP', 'Opened INBOX folder');

    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: ['HEADER', ''], markSeen: false };
    
    logger.info('IMAP', 'Searching inbox for messages');
    const rawResults = await connection.search(searchCriteria, fetchOptions);
    logger.info('IMAP', `Found ${rawResults.length} messages on IMAP server`);

    // Ensure results are sorted ascending by UID before slicing the newest messages
    rawResults.sort((a, b) => (a.attributes.uid || 0) - (b.attributes.uid || 0));

    const targetMessages = limit ? rawResults.slice(-limit) : rawResults;
    logger.info('IMAP', `Processing ${targetMessages.length} messages (limit=${limit || 'none'})`);

    const parsed = [];

    for (const item of targetMessages) {
      const rawPart = item.parts.find((p) => p.which === '');
      if (!rawPart) {
        logger.warn('IMAP', `Email UID ${item.attributes.uid} missing raw body part`);
        continue;
      }

      const mail = await simpleParser(rawPart.body);

      let cleanText = mail.text;
      if (!cleanText && mail.html) {
        cleanText = convert(mail.html, {
          wordwrap: false,
          selectors: [
            { selector: 'img', format: 'skip' },
            { selector: 'a', options: { ignoreHref: true } }
          ]
        });
      }

      const emailObj = {
        id: item.attributes.uid.toString(),
        sender: mail.from?.text || 'Unknown',
        subject: mail.subject || '(No Subject)',
        date: mail.date ? mail.date.toISOString() : new Date().toISOString(),
        body: (cleanText || '').replace(/\s+/g, ' ').trim()
      };

      parsed.push(emailObj);
      logger.debug('IMAP', `Parsed email UID ${emailObj.id}: "${emailObj.subject}" from ${emailObj.sender}`);
    }

    // Sort parsed messages by date descending to align with SQLite's "ORDER BY date DESC"
    parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    logger.info('IMAP', `Completed parsing ${parsed.length} emails`);
    return parsed;
  } catch (err) {
    logger.error('IMAP', 'Failed during IMAP fetch operation', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.end();
        logger.info('IMAP', 'IMAP connection closed cleanly');
      } catch (closeErr) {
        logger.warn('IMAP', 'Error while closing IMAP connection', closeErr);
      }
    }
  }
}