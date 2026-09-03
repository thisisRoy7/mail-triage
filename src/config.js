import 'dotenv/config';

export const config = {
  gmail: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 5000
  },
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: 'qwen2.5-coder:7b'
  },
  port: process.env.PORT || 3000
};