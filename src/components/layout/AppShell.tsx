import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ViewStyle,
} from 'react-native';
import { T } from '../../constants/tokens';

interface AppShellProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default true) */
  scroll?: boolean;
  /** Apply horizontal padding (default true) */
  padded?: boolean;
  /** Background illustration overlay — reserved for future botanical SVGs */
  illustration?: 'none' | 'botanical' | 'floral';
  /** Background colour (default T.bg) */
  bg?: string;
  /** Wrap in SafeAreaView (default true) */
  safeArea?: boolean;
  /** Optional header element rendered above scrollable content */
  header?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  scroll = true,
  padded = true,
  illustration: _illustration = 'none',
  bg = T.bg,
  safeArea = true,
  header,
  style,
  testID,
}) => {
  const Outer = safeArea ? SafeAreaView : View;

  const content = (
    <View style={[padded && styles.padded, style]}>
      {children}
    </View>
  );

  return (
    <Outer style={[styles.root, { backgroundColor: bg }]} testID={testID}>
      <StatusBar barStyle="dark-content" backgroundColor={bg} />
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{content}</View>
      )}
    </Outer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: 16,
  },
});
