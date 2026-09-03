import { config } from './config.js';

export async function analyzeEmail({ subject, sender, body }) {
  const prompt = `Analyze this email:
Subject: ${subject}
From: ${sender}
Body: ${body.slice(0, 1500)}

Return ONLY a JSON object matching this exact schema:
{
  "category": "ACTION_REQUIRED" | "FYI" | "NEWSLETTER" | "SPAM",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "tldr": "One concise summary sentence",
  "suggested_reply": "A professional, ready-to-send draft response"
}`;

  const res = await fetch(`${config.ollama.host}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.model,
      stream: false,
      format: 'json',
      prompt
    })
  });

  const data = await res.json();
  try {
    return JSON.parse(data.response);
  } catch {
    return {
      category: 'FYI',
      urgency: 'LOW',
      tldr: 'Could not parse summary.',
      suggested_reply: 'Thanks for reaching out. I will review this shortly.'
    };
  }
}