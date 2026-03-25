import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Audio } from 'expo-av';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import type { RoleTheme } from '../../theme';

export type MessageType = 'text' | 'image' | 'audio' | 'product';

export interface Message {
  id: string;
  type: MessageType;
  text?: string;
  imageUrl?: string;
  audioUri?: string;
  audioDuration?: number;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  isSent: boolean;       // true = current user sent it
  readReceipt?: 'sent' | 'delivered' | 'read';
  timestamp?: string;
}

interface MessageBubbleProps {
  message: Message;
  role?: RoleTheme;
  onProductPress?: (productId: string) => void;
  onAudioPress?: (audioUri: string) => void;
  audioUri?: string;    // direct audioUri prop for audio playback (overrides message.audioUri)
  testID?: string;
}

// ---------------------------------------------------------------------------
// ReadReceipt — visually distinct indicators for sent / delivered / read
//   sent:      single gray tick   ✓
//   delivered: double gray ticks  ✓✓  (both gray, same weight)
//   read:      double colored ticks ✓✓  (accent color, bold)
// ---------------------------------------------------------------------------
const ReadReceipt: React.FC<{ status: 'sent' | 'delivered' | 'read'; accentColor: string }> = ({
  status,
  accentColor,
}) => {
  if (status === 'sent') {
    // Single gray tick
    return (
      <Text style={[styles.receiptText, { color: Colors.gray400 }]}>✓</Text>
    );
  }
  if (status === 'delivered') {
    // Double gray ticks — normal weight, gray
    return (
      <View style={styles.receiptRow}>
        <Text style={[styles.receiptText, { color: Colors.gray400 }]}>✓</Text>
        <Text style={[styles.receiptText, styles.receiptSecondTick, { color: Colors.gray400 }]}>✓</Text>
      </View>
    );
  }
  // read — double ticks in accent color, bold, with a subtle filled background pill
  return (
    <View style={[styles.receiptRow, styles.receiptReadPill, { backgroundColor: accentColor + '22' }]}>
      <Text style={[styles.receiptText, styles.receiptReadTick, { color: accentColor }]}>✓</Text>
      <Text style={[styles.receiptText, styles.receiptSecondTick, styles.receiptReadTick, { color: accentColor }]}>✓</Text>
    </View>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  role = 'premium',
  onProductPress,
  onAudioPress,
  audioUri: audioUriProp,
  testID,
}) => {
  const primaryColor = Colors[role].primary;
  const { isSent, type, readReceipt } = message;

  // Resolve audio URI: prefer direct prop, fall back to message field
  const resolvedAudioUri = audioUriProp ?? message.audioUri;

  // Internal expo-av playback state
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudioPress = async () => {
    // Always notify parent if callback provided
    if (resolvedAudioUri) {
      onAudioPress?.(resolvedAudioUri);
    }

    if (!resolvedAudioUri) return;

    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
        return;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: resolvedAudioUri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
          setIsPlaying(false);
        }
      });
    } catch {
      setIsPlaying(false);
    }
  };

  return (
    <View style={[styles.row, isSent ? styles.rowSent : styles.rowReceived]} testID={testID}>
      <View
        style={[
          styles.bubble,
          isSent
            ? [styles.bubbleSent, { backgroundColor: primaryColor }]
            : styles.bubbleReceived,
        ]}
      >
        {/* TEXT */}
        {type === 'text' && message.text ? (
          <Text style={[Typography.body2, { color: isSent ? '#FFF' : Colors.gray900 }]}>
            {message.text}
          </Text>
        ) : null}

        {/* IMAGE */}
        {type === 'image' && message.imageUrl ? (
          <Image source={{ uri: message.imageUrl }} style={styles.imageContent} resizeMode="cover" />
        ) : null}

        {/* AUDIO — expo-av internal playback */}
        {type === 'audio' && resolvedAudioUri ? (
          <TouchableOpacity
            style={styles.audioRow}
            onPress={handleAudioPress}
            testID="audio-play-button"
          >
            <Text style={{ fontSize: 20 }}>{isPlaying ? '⏹' : '▶'}</Text>
            <View style={[styles.audioBar, { backgroundColor: isSent ? 'rgba(255,255,255,0.5)' : Colors.gray400 }]} />
            {message.audioDuration != null && (
              <Text style={[Typography.caption, { color: isSent ? '#FFF' : Colors.gray600 }]}>
                {Math.floor(message.audioDuration / 60)}:{String(message.audioDuration % 60).padStart(2, '0')}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        {/* PRODUCT CARD */}
        {type === 'product' && message.product ? (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => onProductPress?.(message.product!.id)}
          >
            {message.product.imageUrl ? (
              <Image source={{ uri: message.product.imageUrl }} style={styles.productImage} resizeMode="cover" />
            ) : null}
            <View style={styles.productInfo}>
              <Text style={[Typography.body2, { fontWeight: '600', color: Colors.gray900 }]} numberOfLines={2}>
                {message.product.name}
              </Text>
              <Text style={[Typography.caption, { color: primaryColor, fontWeight: '600' }]}>
                ₹{message.product.price.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Timestamp + read receipt */}
        <View style={styles.meta}>
          {message.timestamp ? (
            <Text style={[Typography.caption, { color: isSent ? 'rgba(255,255,255,0.7)' : Colors.gray500 }]}>
              {message.timestamp}
            </Text>
          ) : null}
          {isSent && readReceipt ? (
            <View style={{ marginLeft: 4 }}>
              <ReadReceipt status={readReceipt} accentColor={primaryColor} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row:              { flexDirection: 'row', marginVertical: 3, paddingHorizontal: Spacing.md },
  rowSent:          { justifyContent: 'flex-end' },
  rowReceived:      { justifyContent: 'flex-start' },
  bubble:           { maxWidth: '75%', borderRadius: BorderRadius.lg, padding: Spacing.sm, overflow: 'hidden' },
  bubbleSent:       { borderBottomRightRadius: 2 },
  bubbleReceived:   { backgroundColor: Colors.gray200, borderBottomLeftRadius: 2 },
  imageContent:     { width: 200, height: 150, borderRadius: BorderRadius.md },
  audioRow:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, minWidth: 140 },
  audioBar:         { flex: 1, height: 2, borderRadius: 1 },
  productCard:      { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: BorderRadius.md, overflow: 'hidden', width: 220 },
  productImage:     { width: 70, height: 70 },
  productInfo:      { flex: 1, padding: Spacing.xs, justifyContent: 'center' },
  meta:             { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2 },

  // Read receipt styles
  // sent:      single ✓  gray
  // delivered: double ✓✓  gray (normal weight)
  // read:      double ✓✓  accent color, bold, inside a tinted pill
  receiptRow:       { flexDirection: 'row', alignItems: 'center' },
  receiptText:      { fontSize: 11, lineHeight: 14 },
  receiptSecondTick:{ marginLeft: -3 },        // tight overlap for the second tick
  receiptReadTick:  { fontWeight: '700' as const },
  receiptReadPill:  {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});
