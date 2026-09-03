import { config } from './config.js';
import { logger } from './logger.js';

export async function analyzeEmail({ id, subject, sender, body }) {
  const snippet = body ? body.slice(0, 800) : '';
  logger.info('LLM', `Calling classification model for email [id=${id}]`, {
    model: config.ollama.models.classify,
    bodySnippetLength: snippet.length
  });

  const prompt = `Classify this email.
From: ${sender}
Subject: ${subject}
Snippet: ${snippet}

Return ONLY a JSON object matching this exact schema:
{
  "category": "ACTION_REQUIRED" | "FYI" | "NEWSLETTER" | "SPAM",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "tldr": "One concise summary sentence"
}`;

  let res;
  let rawText = '';

  try {
    const url = `${config.ollama.host}/api/generate`;
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.ollama.models.classify,
        stream: false,
        format: 'json',
        keep_alive: -1,
        prompt
      })
    });

    rawText = await res.text();

    if (!res.ok) {
      logger.error('LLM', `Ollama HTTP Error [${res.status} ${res.statusText}] for email [id=${id}]`, rawText);
      throw new Error(`Ollama returned status ${res.status}: ${rawText}`);
    }

    const data = JSON.parse(rawText);
    logger.debug('LLM', `Ollama raw classification response for [id=${id}]`, data.response);

    const parsed = JSON.parse(data.response);
    logger.info('LLM', `Successfully parsed classification for [id=${id}]`, parsed);
    return parsed;
  } catch (err) {
    logger.error('LLM', `Classification parsing failed for [id=${id}]. Triggering default fallback.`, {
      error: err.message,
      rawOllamaResponse: rawText
    });
    return {
      category: 'FYI',
      urgency: 'LOW',
      tldr: 'Could not parse summary.'
    };
  }
}

export async function streamReply({ id, subject, sender, body }, onToken) {
  logger.info('LLM', `Starting draft stream for email [id=${id}]`, {
    model: config.ollama.models.draft
  });

  const prompt = `Write a professional, concise, ready-to-send draft response to this email:
Subject: ${subject}
From: ${sender}
Body: ${body ? body.slice(0, 1500) : ''}

Draft Response:`;

  const url = `${config.ollama.host}/api/generate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.models.draft,
      stream: true,
      keep_alive: '5m',
      prompt
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error('LLM', `Draft streaming HTTP Error [${res.status}] for [id=${id}]`, errText);
    throw new Error(`Ollama stream failed with status ${res.status}: ${errText}`);
  }

  if (!res.body) {
    logger.error('LLM', `No response body returned from Ollama stream for [id=${id}]`);
    throw new Error('Failed to initiate stream from Ollama');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullDraft = '';
  let tokenCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.response) {
          fullDraft += parsed.response;
          tokenCount++;
          onToken(parsed.response);
        }
      } catch (parseErr) {
        logger.warn('LLM', `Error parsing draft streaming JSON chunk: ${line}`, parseErr.message);
      }
    }
  }

  logger.info('LLM', `Draft streaming finished for [id=${id}]`, {
    totalTokensReceived: tokenCount,
    draftLength: fullDraft.length
  });

  return fullDraft;
}