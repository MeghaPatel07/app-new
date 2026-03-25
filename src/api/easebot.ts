import { getIdToken } from '../firebase/auth';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:3000/api/v1';

export async function sendEaseBotMessage(
  conversationId: string,
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): Promise<void> {
  const token = await getIdToken();
  const response = await fetch(`${BACKEND_URL}/easebot/chat`, {
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
