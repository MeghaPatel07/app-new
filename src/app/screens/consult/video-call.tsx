import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Avatar } from '../../../components/primitives/Avatar';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS } from '../../../constants/tokens';

/**
 * Video call screen -- the ONLY dark-themed screen in the app.
 * Uses T.ink for background. Minimal UI overlay.
 */
export default function VideoCallScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { role, accent } = useAccess();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.ink} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.sessionInfo}>
          <View style={[styles.liveDot, { backgroundColor: T.success }]} />
          <Text style={styles.sessionLabel}>
            Consultation Session
          </Text>
        </View>
        <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
      </View>

      {/* Main video area (placeholder) */}
      <View style={styles.videoArea}>
        {isVideoOff ? (
          <View style={styles.videoOffState}>
            <Avatar
              initials="AP"
              size={80}
              bg={accent + '44'}
            />
            <Text style={styles.videoOffLabel}>Video Paused</Text>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Avatar
              initials="AP"
              size={96}
              bg={accent + '33'}
            />
            <Text style={styles.calleeName}>Aisha Patel</Text>
            <Text style={styles.calleeTitle}>Your Stylist</Text>
          </View>
        )}

        {/* Self view (picture-in-picture) */}
        <View style={[styles.selfView, { borderColor: accent }]}>
          <Avatar
            initials="You"
            size={44}
            bg={T.ink}
          />
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.controls}>
        {/* Mute toggle */}
        <TouchableOpacity
          style={[
            styles.controlBtn,
            isMuted && { backgroundColor: T.rose },
          ]}
          onPress={() => setIsMuted(!isMuted)}
          accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
          accessibilityRole="button"
        >
          <Icon
            name={isMuted ? 'close' : 'mic'}
            size={22}
            color={T.white}
          />
          <Text style={styles.controlLabel}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        {/* Video toggle */}
        <TouchableOpacity
          style={[
            styles.controlBtn,
            isVideoOff && { backgroundColor: T.rose },
          ]}
          onPress={() => setIsVideoOff(!isVideoOff)}
          accessibilityLabel={isVideoOff ? 'Turn on video' : 'Turn off video'}
          accessibilityRole="button"
        >
          <Icon
            name={isVideoOff ? 'close' : 'camera'}
            size={22}
            color={T.white}
          />
          <Text style={styles.controlLabel}>
            {isVideoOff ? 'Show' : 'Video'}
          </Text>
        </TouchableOpacity>

        {/* End call */}
        <TouchableOpacity
          style={[styles.controlBtn, styles.endCallBtn]}
          onPress={handleEndCall}
          accessibilityLabel="End call"
          accessibilityRole="button"
          testID="end-call-btn"
        >
          <Icon name="close" size={26} color={T.white} />
          <Text style={styles.controlLabel}>End</Text>
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => {
            // In-call chat - would open a bottom sheet
          }}
          accessibilityLabel="Chat"
          accessibilityRole="button"
        >
          <Icon name="chat" size={22} color={T.white} />
          <Text style={styles.controlLabel}>Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.ink,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionLabel: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.textOnDark,
  },
  timer: {
    fontSize: 16,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.textOnDark,
    letterSpacing: 1,
  },
  videoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoPlaceholder: {
    alignItems: 'center',
  },
  calleeName: {
    marginTop: 16,
    fontSize: 22,
    fontFamily: F.serif,
    fontWeight: '700',
    color: T.textOnDark,
  },
  calleeTitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.dim,
  },
  videoOffState: {
    alignItems: 'center',
  },
  videoOffLabel: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.dim,
  },
  selfView: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 86,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    backgroundColor: T.gray800,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: T.gray900 + 'DD',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
  },
  controlBtn: {
    minWidth: 60,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    backgroundColor: T.gray700 + '88',
    padding: 10,
  },
  controlLabel: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.textOnDark,
  },
  endCallBtn: {
    backgroundColor: T.rose,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});
