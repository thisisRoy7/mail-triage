// Handles HTTP requests & Server-Sent Events streams
export async function fetchEmails(urgency = 'ALL') {
  const query = urgency !== 'ALL' ? `?urgency=${urgency}` : '';
  const res = await fetch(`/api/emails${query}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function triggerSync() {
  const res = await fetch('/api/sync', { method: 'POST' });
  if (res.status === 409) throw new Error('A background operation is currently running.');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function triggerReset(type) {
  const res = await fetch(`/api/reset/${type}`, { method: 'POST' });
  if (res.status === 409) throw new Error('A background operation is currently running.');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function subscribeProgress(onMessage, onError) {
  const evt = new EventSource('/api/progress/stream');
  evt.onmessage = (e) => onMessage(JSON.parse(e.data));
  evt.onerror = (e) => onError && onError(e);
  return evt;
}

export function openDraftStream(id, onToken, onDone, onError) {
  const evt = new EventSource(`/api/emails/${id}/draft/stream`);
  evt.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.token) onToken(data.token);
    if (data.done || data.error) {
      evt.close();
      if (data.error) onError(data.error);
      else onDone();
    }
  };
  evt.onerror = (e) => {
    evt.close();
    onError(e);
  };
  return evt;
}