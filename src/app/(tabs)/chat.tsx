import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseStorage } from '../../firebase/config';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { useAccess } from '../../hooks/useAccess';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble, type Message } from '../../components/chat/MessageBubble';
import { TrialLimitBanner } from '../../components/chat/TrialLimitBanner';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

export default function ChatTab() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { isGuest, isFree, isPremium, isStylist } = useAccess();

  // Chat session is keyed to the user's UID
  const chatId = user?.uid ?? '';
  const { messages, trialMeta, isLoading, sendMessage } = useChat(chatId);

  // ── Trial logic — derived from server-side trialChatMeta ──────────────────
  // Premium users and stylists have no limit at all; skip all trial checks.
  const skipTrialCheck = isPremium || isStylist;
  const isLimited = !skipTrialCheck && (trialMeta?.limitReached ?? false);
  const remaining = skipTrialCheck
    ? Infinity
    : Math.max(0, 10 - (trialMeta?.messageCount ?? 0));
  const showBanner = !skipTrialCheck && remaining <= 3;

  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Show upgrade modal automatically when limit is first reached
  const prevLimited = useRef(false);
  if (isLimited && !prevLimited.current) {
    prevLimited.current = true;
    // Use setTimeout to avoid setState-during-render warning
    setTimeout(() => setUpgradeModalVisible(true), 0);
  }
  if (!isLimited) prevLimited.current = false;

  // ── Guest gate ─────────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={[Typography.h3, { color: Colors.premium.textSecondary, textAlign: 'center' }]}>
            Sign in to chat with your stylist
          </Text>
          <TouchableOpacity
            testID="chat-sign-in-button"
            style={[styles.actionBtn, { borderColor: Colors.guest.primary }]}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={{ color: Colors.guest.primary, fontWeight: '600', fontSize: 15 }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── No stylist assigned ────────────────────────────────────────────────────
  if (!profile?.stylistId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.premium.background }]}>
        <View style={styles.center}>
          <Text style={[Typography.h3, { color: Colors.premium.textSecondary, textAlign: 'center' }]}>
            Chat with your stylist
          </Text>
          <Text style={[Typography.body1, { color: Colors.premium.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
            A stylist will be assigned after you purchase a package.
          </Text>
          <TouchableOpacity
            testID="chat-get-package-button"
            style={[styles.actionBtn, { borderColor: Colors.client.primary }]}
            onPress={() => router.push('/packages')}
          >
            <Text style={{ color: Colors.client.primary, fontWeight: '600' }}>
              View Packages
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Send text ──────────────────────────────────────────────────────────────
  const handleSendText = async (text: string) => {
    if (isLimited) {
      setUpgradeModalVisible(true);
      return;
    }
    await sendMessage({ type: 'text', text });
  };

  // ── Send audio — upload to Firebase Storage then send 'audio' message ─────
  const handleSendAudio = async (uri: string, duration: number) => {
    if (isLimited) {
      setUpgradeModalVisible(true);
      return;
    }
    try {
      const timestamp = Date.now();
      const storageRef = ref(firebaseStorage, `chats/${chatId}/audio/${timestamp}.m4a`);
      const response = await fetch(uri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const audioUrl = await getDownloadURL(storageRef);
      await sendMessage({ type: 'audio', audioUrl, audioDuration: duration } as any);
    } catch (err) {
      console.warn('[ChatTab] Audio upload failed:', err);
    }
  };

  // ── Map Firestore messages → MessageBubble format ─────────────────────────
  const bubbleMessages: Message[] = messages.map(m => ({
    id: m.id,
    type: m.type,
    text: m.text,
    imageUrl: m.imageUrl,
    audioUri: m.audioUrl,
    isSent: m.senderId === user?.uid,
    readReceipt: m.readBy && m.readBy.length > 1 ? 'read' : 'delivered',
  }));

  const role = isPremium ? 'premium' : 'client';
  const primaryColor = isPremium ? Colors.premium.primary : Colors.client.primary;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.premium.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={[Typography.h3, { color: Colors.client.text }]}>Chat</Text>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
          {isFree && !isLimited && remaining < Infinity && (
            <Text testID="chat-trial-remaining" style={styles.trialRemaining}>
              {remaining === 0 ? 'Limit reached' : `Trial: ${remaining} left`}
            </Text>
          )}
        </View>

        {/* ── Message list ────────────────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={primaryColor} />
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
                testID={`msg-${item.id}`}
                message={item}
                role={role}
                onProductPress={id => router.push(`/product/${id}` as any)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={{ color: Colors.premium.textMuted, textAlign: 'center' }}>
                  No messages yet. Say hi!
                </Text>
              </View>
            }
          />
        )}

        {/* ── Trial limit banner (remaining <= 3, non-premium) ────────────── */}
        {showBanner && (
          <TrialLimitBanner
            testID="trial-limit-banner"
            remaining={remaining}
            onUpgrade={() => router.push('/packages')}
            role="guest"
          />
        )}

        {/* ── Chat input ──────────────────────────────────────────────────── */}
        <ChatInput
          testID="chat-input"
          onSendText={handleSendText}
          onSendAudio={handleSendAudio}
          disabled={isLimited}
          role={role}
        />
      </KeyboardAvoidingView>

      {/* ── Upgrade modal (shown when limit reached) ─────────────────────── */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox} testID="upgrade-modal">
            <Text style={[Typography.h3, { textAlign: 'center', marginBottom: Spacing.sm }]}>
              You've reached your 10-message limit
            </Text>
            <Text style={[Typography.body1, { color: Colors.premium.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }]}>
              Upgrade to WeddingEase Premium to continue chatting with your stylist.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                testID="upgrade-modal-packages-btn"
                style={[styles.modalPrimaryBtn, { backgroundColor: Colors.client.primary }]}
                onPress={() => {
                  setUpgradeModalVisible(false);
                  router.push('/packages');
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>View Packages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="upgrade-modal-dismiss-btn"
                style={styles.modalSecondaryBtn}
                onPress={() => setUpgradeModalVisible(false)}
              >
                <Text style={{ color: Colors.premium.textSecondary }}>Not Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.premium.border,
    backgroundColor: Colors.premium.surface,
  },
  premiumBadge: {
    backgroundColor: Colors.premium?.primary ?? '#7C3AED',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trialRemaining: {
    color: Colors.premium.textMuted,
    fontSize: 12,
  },
  messageList: { padding: Spacing.md, paddingBottom: Spacing.lg },
  emptyChat: { padding: Spacing.xl },
  actionBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalBox: {
    backgroundColor: Colors.premium.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.premium.border,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    shadowColor: Colors.premium.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalActions: {
    gap: Spacing.sm,
  },
  modalPrimaryBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  modalSecondaryBtn: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
});
