import 'dotenv/config';
import { logger } from './logger.js';

function resolveOllamaUrl(rawHost) {
  if (!rawHost) {
    logger.debug('CONFIG', 'No OLLAMA_HOST provided, defaulting to http://127.0.0.1:11434');
    return 'http://127.0.0.1:11434';
  }
  
  let host = rawHost.trim();
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = `http://${host}`;
  }
  host = host.replace('0.0.0.0', '127.0.0.1');
  
  const parsed = new URL(host);
  if (!parsed.port) {
    parsed.port = '11434';
  }
  
  const resolved = parsed.origin;
  logger.debug('CONFIG', `Resolved Ollama URL: ${resolved}`);
  return resolved;
}

export const config = {
  gmail: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
    },
    authTimeout: 10000
  },
  ollama: {
    host: resolveOllamaUrl(process.env.OLLAMA_HOST),
    models: {
      classify: 'qwen2.5-coder:1.5b-instruct',
      draft: 'qwen2.5-coder:7b',
      embed: 'nomic-embed-text'
    }
  },
  port: process.env.PORT || 3000
};

logger.info('CONFIG', 'Configuration initialized', {
  gmailUser: config.gmail.user ? `${config.gmail.user.slice(0, 3)}***` : 'NOT_SET',
  ollamaHost: config.ollama.host,
  models: config.ollama.models,
  port: config.port
});