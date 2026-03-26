import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '../../../components/layout/AppShell';
import { ScreenHeader } from '../../../components/layout/ScreenHeader';
import { Icon } from '../../../components/primitives/Icon';
import { useAccess } from '../../../hooks/useAccess';
import { T, F, RADIUS, SHADOW } from '../../../constants/tokens';

interface SharedDocument {
  id: string;
  title: string;
  type: 'image' | 'pdf' | 'note';
  thumbnailUri?: string;
  sharedBy: string;
  date: string;
  size?: string;
}

const ICON_MAP: Record<SharedDocument['type'], string> = {
  image: 'image',
  pdf: 'info',
  note: 'edit',
};

/**
 * Shared documents viewer.
 * Shows documents shared between client and stylist.
 */
export default function SharedDocumentsScreen() {
  const router = useRouter();
  const { role, accent } = useAccess();

  // Placeholder data -- in production from a useSharedDocuments() hook
  const documents: SharedDocument[] = [
    {
      id: '1',
      title: 'Bridal Mood Board',
      type: 'image',
      sharedBy: 'Aisha Patel',
      date: '20 Mar 2026',
      size: '2.4 MB',
    },
    {
      id: '2',
      title: 'Fabric Options Guide',
      type: 'pdf',
      sharedBy: 'Aisha Patel',
      date: '18 Mar 2026',
      size: '1.1 MB',
    },
    {
      id: '3',
      title: 'Session Notes - Mar 15',
      type: 'note',
      sharedBy: 'Aisha Patel',
      date: '15 Mar 2026',
    },
    {
      id: '4',
      title: 'Colour Palette Reference',
      type: 'image',
      sharedBy: 'You',
      date: '12 Mar 2026',
      size: '800 KB',
    },
  ];

  return (
    <AppShell
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Shared Documents"
          onBack={() => router.back()}
        />
      }
      testID="shared-documents-screen"
    >
      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="image" size={48} color={T.muted} />
          <Text style={styles.emptyTitle}>No shared documents</Text>
          <Text style={styles.emptyBody}>
            Documents shared between you and your stylist will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.docCard}
              onPress={() => {
                // Open document viewer
              }}
              accessibilityLabel={item.title}
              accessibilityRole="button"
              testID={`doc-${item.id}`}
            >
              {/* Thumbnail / icon */}
              <View style={[styles.docIcon, { backgroundColor: accent + '14' }]}>
                {item.thumbnailUri ? (
                  <Image
                    source={{ uri: item.thumbnailUri }}
                    style={styles.docThumbnail}
                  />
                ) : (
                  <Icon
                    name={ICON_MAP[item.type]}
                    size={24}
                    color={accent}
                  />
                )}
              </View>

              {/* Info */}
              <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.docMetaRow}>
                  <Text style={styles.docMeta}>
                    {item.sharedBy} · {item.date}
                  </Text>
                  {item.size && (
                    <Text style={styles.docSize}>{item.size}</Text>
                  )}
                </View>
              </View>

              {/* Type badge */}
              <View style={[styles.typeBadge, { backgroundColor: accent + '18' }]}>
                <Text style={[styles.typeBadgeText, { color: accent }]}>
                  {item.type.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
  listContent: {
    padding: 16,
    gap: 10,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    ...SHADOW.card,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  docThumbnail: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
  },
  docInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docTitle: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  docMeta: {
    fontSize: 12,
    fontFamily: F.sans,
    color: T.dim,
  },
  docSize: {
    fontSize: 11,
    fontFamily: F.sans,
    color: T.muted,
  },
  typeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: F.sans,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
