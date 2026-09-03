import 'dotenv/config';

function resolveOllamaUrl(rawHost) {
  if (!rawHost) return 'http://127.0.0.1:11434';
  
  let host = rawHost.trim();
  // Ensure protocol exists
  if (!host.startsWith('http://') && !host.startsWith('https://')) {
    host = `http://${host}`;
  }
  // If host is set to 0.0.0.0, target localhost/127.0.0.1
  host = host.replace('0.0.0.0', '127.0.0.1');
  
  // If no port is specified, append the default Ollama 11434 port
  const parsed = new URL(host);
  if (!parsed.port) {
    parsed.port = '11434';
  }
  
  return parsed.origin;
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
    model: 'qwen2.5-coder:7b'
  },
  port: process.env.PORT || 3000
};