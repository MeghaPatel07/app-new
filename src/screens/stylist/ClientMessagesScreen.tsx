import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from '../../firebase/config';
import { T, RADIUS } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { useChat } from '../../hooks/useChat';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble, type Message } from '../../components/chat/MessageBubble';

// ---------------------------------------------------------------------------
// Stylist → Individual Client Chat
// Same ChatBubble/ChatInput UI. No trial limit for stylist. Purple send button.
// ---------------------------------------------------------------------------

export default function ClientMessagesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId: string; clientName: string }>();
  const { isStylist } = useAccess();
  const { user } = useAuthStore();

  const clientId = params.clientId ?? '';
  const clientName = params.clientName ?? 'Client';

  // Use the client's UID as the chat ID (same pattern as client chat)
  const { messages, isLoading, sendMessage } = useChat(clientId);
  const listRef = useRef<FlatList>(null);

  // ── Send text ──────────────────────────────────────────────────
  const handleSendText = useCallback(
    async (text: string) => {
      await sendMessage({ type: 'text', text });
    },
    [sendMessage]
  );

  // ── Send audio ─────────────────────────────────────────────────
  const handleSendAudio = useCallback(
    async (uri: string, duration: number) => {
      try {
        const timestamp = Date.now();
        const storageRef = ref(firebaseStorage, `chats/${clientId}/audio/${timestamp}.m4a`);
        const response = await fetch(uri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        const audioUrl = await getDownloadURL(storageRef);
        await sendMessage({ type: 'audio', audioUrl, audioDuration: duration } as any);
      } catch (err) {
        console.warn('[ClientMessages] Audio upload failed:', err);
      }
    },
    [clientId, sendMessage]
  );

  // Map to bubble format
  const bubbleMessages: Message[] = messages.map(m => ({
    id: m.id,
    type: m.type,
    text: m.text,
    imageUrl: m.imageUrl,
    audioUri: m.audioUrl,
    isSent: m.senderId === user?.uid,
    readReceipt: m.readBy && m.readBy.length > 1 ? 'read' : 'delivered',
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {clientName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.headerName} numberOfLines={1}>
                {clientName}
              </Text>
              <Text style={styles.headerSub}>Client</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() =>
              router.push({
                pathname: '/screens/stylist/client-profile' as any,
                params: { clientId },
              })
            }
          >
            <Text style={styles.profileBtnText}>{'\u{1F464}'}</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={T.purple} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={bubbleMessages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.messageList}
            inverted
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                role="stylist"
                onProductPress={id => router.push(`/product/${id}` as any)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyIcon}>{'\u{1F4AC}'}</Text>
                <Text style={styles.emptyText}>
                  Start a conversation with {clientName}
                </Text>
              </View>
            }
          />
        )}

        {/* Input — no trial limit for stylist */}
        <ChatInput
          testID="stylist-chat-input"
          onSendText={handleSendText}
          onSendAudio={handleSendAudio}
          disabled={false}
          role="stylist"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
    gap: Spacing.xs,
  },
  backBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  backArrow: { fontSize: 22, color: T.purple },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: T.white, fontSize: 16, fontWeight: '700' },
  headerName: { fontSize: 16, fontWeight: '700', color: T.heading },
  headerSub: { fontSize: 12, color: T.body },
  profileBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  profileBtnText: { fontSize: 20 },

  // Message list
  messageList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  // Empty
  emptyChat: {
    alignItems: 'center',
    padding: Spacing.xl,
    // Inverted list — so this appears at center
    transform: [{ scaleY: -1 }],
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: {
    fontSize: 14,
    color: T.body,
    textAlign: 'center',
  },
});
