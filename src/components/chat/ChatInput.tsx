import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme';
import type { RoleTheme } from '../../theme';

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendAudio?: (uri: string, duration: number) => void;
  onPickImage?: () => void;
  disabled?: boolean;        // true when trial limit hit
  role?: RoleTheme;
  testID?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendText,
  onSendAudio,
  onPickImage,
  disabled = false,
  role = 'premium',
  testID,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingStartedAt = useRef<number>(0);
  const primaryColor = Colors[role].primary;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText('');
  };

  const startRecording = async () => {
    if (disabled) return;
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission',
          'Microphone access is required to send voice messages.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      recordingStartedAt.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.warn('[ChatInput] Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not start voice recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();

      // Restore audio mode for playback
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recordingRef.current.getURI();
      const durationMs = Date.now() - recordingStartedAt.current;
      const durationSec = Math.round(durationMs / 1000);

      recordingRef.current = null;

      if (uri && durationSec >= 1) {
        onSendAudio?.(uri, durationSec);
      }
    } catch (err) {
      console.warn('[ChatInput] Failed to stop recording:', err);
      recordingRef.current = null;
    }
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Image picker */}
      <TouchableOpacity
        testID="chat-image-picker"
        onPress={onPickImage}
        disabled={disabled}
        style={[styles.iconBtn, disabled && styles.iconDisabled]}
      >
        <Text style={styles.iconText}>📎</Text>
      </TouchableOpacity>

      {/* Text field */}
      <TextInput
        testID="chat-text-input"
        style={[styles.input, disabled && styles.inputDisabled]}
        value={text}
        onChangeText={setText}
        placeholder={disabled ? 'Upgrade to continue chatting…' : 'Type a message…'}
        placeholderTextColor={Colors.gray400}
        multiline
        maxLength={1000}
        editable={!disabled}
      />

      {/* Send or audio */}
      {text.trim().length > 0 ? (
        <TouchableOpacity
          testID="chat-send-btn"
          onPress={handleSend}
          disabled={disabled}
          style={[styles.sendBtn, { backgroundColor: primaryColor }, disabled && styles.iconDisabled]}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          testID="chat-audio-btn"
          onLongPress={startRecording}
          onPressOut={stopRecording}
          disabled={disabled}
          delayLongPress={200}
          style={[
            styles.iconBtn,
            isRecording && { backgroundColor: Colors.error + '22' },
            disabled && styles.iconDisabled,
          ]}
        >
          <Text style={styles.iconText}>{isRecording ? '🔴' : '🎤'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    gap: Spacing.xs,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    maxHeight: 100,
    ...Typography.body2,
    color: Colors.gray900,
  },
  inputDisabled: {
    backgroundColor: Colors.gray100,
    color: Colors.gray500,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: { opacity: 0.4 },
  iconText: { fontSize: 20 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: '#FFF', fontSize: 16 },
});
