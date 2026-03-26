import React, { useRef, useState } from 'react';
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
import { Icon } from '../../components/primitives/Icon';
import { Button } from '../../components/ui/Button';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';

/**
 * Chat tab screen.
 * Free trial: TrialChatBanner + 10-message counter.
 * Premium: Unlimited chat with stylist.
 * Uses useAccess() for all role-based rendering.
 */
export default function ChatTab() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { isGuest, isFree, isPremium, isStylist, accent, hasUnlimitedChat, showUpgradePrompts } = useAccess();

  // Chat session keyed to user UID
  const chatId = user?.uid ?? '';
  const { messages, trialMeta, isLoading, sendMessage } = useChat(chatId);

  // Trial logic -- derived from server-side trialChatMeta
  const skipTrialCheck = hasUnlimitedChat || isStylist;
  const isLimited = !skipTrialCheck && (trialMeta?.limitReached ?? false);
  const remaining = skipTrialCheck
    ? Infinity
    : Math.max(0, 10 - (trialMeta?.messageCount ?? 0));
  const showBanner = !skipTrialCheck && remaining <= 3;

  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const listRef = useRef<FlatList>(null);

  // Show upgrade modal when limit first reached
  const prevLimited = useRef(false);
  if (isLimited && !prevLimited.current) {
    prevLimited.current = true;
    setTimeout(() => setUpgradeModalVisible(true), 0);
  }
  if (!isLimited) prevLimited.current = false;

  // Guest gate
  if (isGuest) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
        <View style={styles.center}>
          <Icon name="chat" size={48} color={T.muted} />
          <Text style={styles.gateTitle}>
            Sign in to chat with your stylist
          </Text>
          <Text style={styles.gateBody}>
            Get personalised styling advice from a dedicated WeddingEase stylist.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.push('/auth/login')}
            variant="outline"
            testID="chat-sign-in-button"
          />
        </View>
      </SafeAreaView>
    );
  }

  // No stylist assigned state
  if (!profile?.stylistId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
        <View style={styles.center}>
          <Icon name="chat" size={48} color={T.muted} />
          <Text style={styles.gateTitle}>Chat with your stylist</Text>
          <Text style={styles.gateBody}>
            A stylist will be assigned after you purchase a package.
          </Text>
          <Button
            title="View Packages"
            onPress={() => router.push('/packages')}
            variant="outline"
            testID="chat-get-package-button"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Send text
  const handleSendText = async (text: string) => {
    if (isLimited) {
      setUpgradeModalVisible(true);
      return;
    }
    await sendMessage({ type: 'text', text });
  };

  // Send audio
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

  // Map Firestore messages to MessageBubble format
  const bubbleMessages: Message[] = messages.map((m) => ({
    id: m.id,
    type: m.type,
    text: m.text,
    imageUrl: m.imageUrl,
    audioUri: m.audioUrl,
    isSent: m.senderId === user?.uid,
    readReceipt: m.readBy && m.readBy.length > 1 ? 'read' : 'delivered',
  }));

  const roleLabel = isPremium ? 'premium' : 'client';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat</Text>
          {isPremium && (
            <View style={[styles.premiumBadge, { backgroundColor: accent }]}>
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
          {isFree && !isLimited && remaining < Infinity && (
            <Text testID="chat-trial-remaining" style={styles.trialRemaining}>
              {remaining === 0 ? 'Limit reached' : `Trial: ${remaining} left`}
            </Text>
          )}
        </View>

        {/* Trial banner -- shown when remaining <= 3 for free users */}
        {showBanner && (
          <TrialLimitBanner
            testID="trial-limit-banner"
            remaining={remaining}
            onUpgrade={() => router.push('/packages')}
            role="guest"
          />
        )}

        {/* Message list */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={accent} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={bubbleMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messageList}
            inverted
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <MessageBubble
                testID={`msg-${item.id}`}
                message={item}
                role={roleLabel}
                onProductPress={(id) => router.push(`/product/${id}` as any)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>
                  No messages yet. Say hi!
                </Text>
              </View>
            }
          />
        )}

        {/* Chat input -- disabled when limit reached */}
        <ChatInput
          testID="chat-input"
          onSendText={handleSendText}
          onSendAudio={handleSendAudio}
          disabled={isLimited}
          role={roleLabel}
        />
      </KeyboardAvoidingView>

      {/* Upgrade modal (shown when limit reached) */}
      <Modal
        visible={upgradeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpgradeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox} testID="upgrade-modal">
            <Text style={styles.modalTitle}>
              You've reached your 10-message limit
            </Text>
            <Text style={styles.modalBody}>
              Upgrade to WeddingEase Premium to continue chatting with your stylist.
            </Text>
            <View style={styles.modalActions}>
              <Button
                title="View Packages"
                onPress={() => {
                  setUpgradeModalVisible(false);
                  router.push('/packages');
                }}
                variant="primary"
                fullWidth
                testID="upgrade-modal-packages-btn"
              />
              <TouchableOpacity
                testID="upgrade-modal-dismiss-btn"
                style={styles.modalDismissBtn}
                onPress={() => setUpgradeModalVisible(false)}
              >
                <Text style={styles.modalDismissText}>Not Now</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  gateTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    textAlign: 'center',
  },
  gateBody: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  premiumBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: T.white,
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trialRemaining: {
    color: T.dim,
    fontSize: 12,
    fontFamily: F.sans,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyChat: {
    padding: 32,
  },
  emptyChatText: {
    color: T.dim,
    fontSize: 14,
    fontFamily: F.sans,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBox: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    ...SHADOW.elevated,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalActions: {
    gap: 8,
  },
  modalDismissBtn: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDismissText: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
  },
});
