import { api } from '../lib/api';
import { getIdToken } from '../firebase/auth';

export async function sendEaseBotMessage(
  conversationId: string,
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  const token = await getIdToken();
  const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
  const response = await fetch(`${baseURL}/ai/easebot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ conversationId, message }),
  });

  if (!response.ok) {
    onError(new Error(`EaseBot error: ${response.status}`));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) { onDone(); return; }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) { onDone(); break; }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) onChunk(parsed.text);
        } catch {}
      }
    }
  }
}
