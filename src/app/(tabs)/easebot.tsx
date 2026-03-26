import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../components/layout/AppShell';
import { ScreenHeader } from '../../components/layout/ScreenHeader';
import { AccessGate } from '../../components/shared/AccessGate';
import { EaseBotLocked } from '../../components/shared/EaseBotLocked';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { useAccess } from '../../hooks/useAccess';
import { useAuthStore } from '../../store/authStore';
import { sendEaseBotMessage } from '../../api/easebot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function EaseBotTab() {
  const router = useRouter();
  const { canEaseBot, isGuest } = useAccess();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationIdRef = useRef<string>(user?.uid ?? `conv_${Date.now()}`);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
    };

    const assistantMsgId = `assist_${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    await sendEaseBotMessage(
      conversationIdRef.current,
      text,
      // onChunk: append streamed text to the assistant message
      (chunk: string) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      },
      // onDone
      () => {
        setIsStreaming(false);
      },
      // onError
      (err: Error) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
              : m
          )
        );
        setIsStreaming(false);
      }
    );
  }, [input, isStreaming]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant,
          ]}
        >
          {item.content || (isStreaming ? '...' : '')}
        </Text>
      </View>
    );
  }, [isStreaming]);

  return (
    <AppShell
      header={<ScreenHeader title="EaseBot" />}
      scroll={false}
      padded={false}
    >
      <AccessGate
        flag="canEaseBot"
        fallback={
          <EaseBotLocked
            onRegister={() => router.push('/auth/register')}
            onUpgrade={() => router.push('/screens/packages/list')}
            testID="easebot-locked"
          />
        }
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          {/* Messages list */}
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.aiCard}>
                <Text style={styles.aiIcon}>{'\u2728'}</Text>
                <Text style={styles.aiTitle}>Ask EaseBot</Text>
                <Text style={styles.aiBody}>
                  Your AI wedding stylist. Get personalised advice on outfits,
                  colour combinations, accessories, and more.
                </Text>
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about outfits, styling tips..."
              placeholderTextColor={T.dim}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              editable={!isStreaming}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              testID="easebot-input"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isStreaming) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || isStreaming}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              testID="easebot-send"
            >
              {isStreaming ? (
                <ActivityIndicator size="small" color={T.white} />
              ) : (
                <Text style={styles.sendBtnText}>{'\u2191'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </AccessGate>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  aiCard: {
    backgroundColor: T.goldBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.gold + '44',
    padding: 20,
    alignItems: 'center',
  },
  aiIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  aiTitle: {
    fontSize: 20,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.heading,
    marginBottom: 8,
  },
  aiBody: {
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 21,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: T.accent,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: T.cardBg,
    borderWidth: 1,
    borderColor: T.border,
    borderBottomLeftRadius: 4,
    ...SHADOW.card,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: F.sans,
    lineHeight: 21,
  },
  bubbleTextUser: {
    color: T.white,
  },
  bubbleTextAssistant: {
    color: T.ink,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
    backgroundColor: T.bg,
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: RADIUS.md,
    backgroundColor: T.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.ink,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: T.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: T.white,
  },
});
