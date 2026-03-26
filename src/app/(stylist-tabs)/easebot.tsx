import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { T, RADIUS } from '../../constants/tokens';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble, type Message } from '../../components/chat/MessageBubble';

// ---------------------------------------------------------------------------
// Stylist EaseBot — Research assistant
// Same EaseBot chat UI but with purple accent (T.purple).
// For researching trends, products, styling advice.
// ---------------------------------------------------------------------------

interface BotMessage {
  id: string;
  text: string;
  isSent: boolean;
  timestamp: string;
}

const WELCOME_SUGGESTIONS = [
  'Latest bridal lehenga trends 2026',
  'Hairstyle ideas for a beach wedding',
  'Product recommendations for dry skin brides',
  'Colour palette for a winter wedding',
];

export default function StylistEaseBot() {
  const { canEaseBot, isStylist } = useAccess();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: BotMessage = {
        id: `user-${Date.now()}`,
        text,
        isSent: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages(prev => [userMsg, ...prev]);
      setIsTyping(true);

      // Simulate EaseBot response (actual API call goes through api/easebot.ts)
      try {
        // In production: const response = await easebotApi.ask(text);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const botMsg: BotMessage = {
          id: `bot-${Date.now()}`,
          text: `I'll research "${text}" for you. This is a placeholder response — the EaseBot API integration provides real styling intelligence and product recommendations.`,
          isSent: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages(prev => [botMsg, ...prev]);
      } finally {
        setIsTyping(false);
      }
    },
    []
  );

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend]
  );

  // Map to MessageBubble format
  const bubbleMessages: Message[] = messages.map(m => ({
    id: m.id,
    type: 'text' as const,
    text: m.text,
    isSent: m.isSent,
    timestamp: m.timestamp,
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
          <View style={styles.headerLeft}>
            <View style={styles.botAvatar}>
              <Text style={styles.botAvatarText}>{'\u2728'}</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>EaseBot</Text>
              <Text style={styles.headerSubtitle}>Styling Research Assistant</Text>
            </View>
          </View>
        </View>

        {/* Message list */}
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIconWrap}>
              <Text style={styles.welcomeIcon}>{'\u2728'}</Text>
            </View>
            <Text style={styles.welcomeTitle}>EaseBot Research</Text>
            <Text style={styles.welcomeSubtitle}>
              Your AI-powered styling research assistant. Ask about trends,
              products, styling advice, or get recommendations for your clients.
            </Text>
            <Text style={styles.suggestionsLabel}>TRY ASKING</Text>
            {WELCOME_SUGGESTIONS.map((suggestion, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
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
              />
            )}
            ListHeaderComponent={
              isTyping ? (
                <View style={styles.typingRow}>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color={T.purple} />
                    <Text style={styles.typingText}>EaseBot is thinking...</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Input */}
        <ChatInput
          testID="easebot-input"
          onSendText={handleSend}
          disabled={false}
          role="stylist"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: T.bg,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.cardBg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.purpleBg,
    borderWidth: 1.5,
    borderColor: T.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarText: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: T.purple,
  },
  headerSubtitle: {
    fontSize: 12,
    color: T.body,
  },

  // Welcome
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  welcomeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: T.purpleBg,
    borderWidth: 2,
    borderColor: T.purple + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  welcomeIcon: {
    fontSize: 32,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: T.heading,
    marginBottom: Spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: T.dim,
    marginBottom: Spacing.sm,
  },
  suggestionChip: {
    backgroundColor: T.purpleBg,
    borderWidth: 1,
    borderColor: T.purple + '33',
    borderRadius: RADIUS.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
    width: '100%',
  },
  suggestionText: {
    fontSize: 13,
    color: T.purple,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Message list
  messageList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.s2,
    borderRadius: RADIUS.lg,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  typingText: {
    fontSize: 13,
    color: T.body,
    fontStyle: 'italic',
  },
});
