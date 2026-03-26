import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { AccessGate } from '../../../components/shared/AccessGate';
import { StyleBoardCard, type StyleBoard } from '../../../components/shared/StyleBoardCard';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { styleBoardsApi } from '../../../api/styleBoards';
import { T, F, RADIUS } from '../../../constants/tokens';

/**
 * Style board list. Premium only (AccessGate).
 * Shows boards created by the assigned stylist.
 */
export default function StyleBoardListScreen() {
  const router = useRouter();
  const { role, accent, canViewStyleBoard } = useAccess();

  const [boards, setBoards] = useState<StyleBoard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await styleBoardsApi.getBoards();
      setBoards((res.data as any)?.boards ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load style boards');
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  return (
    <AccessGate
      flag="canViewStyleBoard"
      lockedLabel="Upgrade to View Style Boards"
      onLockedPress={() => router.push('/packages' as any)}
    >
      <AppShell
        scroll={false}
        padded={false}
        header={
          <ScreenHeader
            title="Style Boards"
            onBack={() => router.back()}
          />
        }
        testID="style-board-list-screen"
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={accent} size="large" />
          </View>
        ) : boards.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="palette" size={48} color={T.muted} />
            <Text style={styles.emptyTitle}>No style boards yet</Text>
            <Text style={styles.emptyBody}>
              Your stylist will create personalised style boards for you. Check back soon!
            </Text>
          </View>
        ) : (
          <FlatList
            data={boards}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <StyleBoardCard
                board={item}
                onPress={() =>
                  router.push(`/screens/style-board/detail?boardId=${item.id}` as any)
                }
                style={styles.gridCard}
                testID={`board-${item.id}`}
              />
            )}
          />
        )}
      </AppShell>
    </AccessGate>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: F.serif,
    fontWeight: '600',
    color: T.heading,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  gridContent: {
    padding: 16,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    maxWidth: '48%',
  },
});
