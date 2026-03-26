import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  writeBatch,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../store/authStore';
import type { ChatMessage, TrialMeta } from '../types';

export type { ChatMessage, TrialMeta };

export function useChat(chatId: string) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [trialMeta, setTrialMeta] = useState<TrialMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Messages listener ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return unsub;
  }, [chatId]);

  // ── Trial meta listener (server-side counter written by Cloud Function) ────
  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, 'trialChatMeta', chatId), snap => {
      setTrialMeta(snap.exists() ? (snap.data() as TrialMeta) : null);
    }, () => {});
    return unsub;
  }, [chatId]);

  // ── Mark unread messages as read when messages are loaded ─────────────────
  useEffect(() => {
    if (!user || !chatId || messages.length === 0) return;

    const uid = user.uid;
    const unread = messages.filter(m => m.senderId !== uid && !m.readBy?.includes(uid));
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(msg => {
      const ref = doc(db, 'chats', chatId, 'messages', msg.id);
      batch.update(ref, {
        readBy: arrayUnion(uid),
      });
    });
    batch.commit().catch(() => {});
  }, [chatId, messages, user]);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content: Partial<ChatMessage>) => {
    if (!user) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: user.uid,
      type: 'text',
      readBy: [user.uid],
      createdAt: serverTimestamp(),
      ...content,
    });
  }, [chatId, user]);

  // ── Convenience getters for messagesUsed / limitReached ───────────────────
  const messagesUsed = useMemo(() => trialMeta?.messageCount ?? 0, [trialMeta]);
  const limitReached = useMemo(() => trialMeta?.limitReached ?? false, [trialMeta]);

  return {
    messages,
    trialMeta,
    isLoading,
    sendMessage,
    messagesUsed,
    limitReached,
  };
}
