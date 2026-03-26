import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

export interface StyleBoardItem {
  id: string;
  imageUri: string;
  label?: string;
}

interface StyleBoardEditorProps {
  /** Vision note text */
  visionNote: string;
  onVisionNoteChange?: (text: string) => void;
  /** Palette hex colours */
  palette: string[];
  onPaletteChange?: (colors: string[]) => void;
  /** Grid of board images */
  items: StyleBoardItem[];
  onAddItem?: () => void;
  onRemoveItem?: (id: string) => void;
  /** Share callback */
  onShare?: () => void;
  /** When false, all inputs are read-only */
  isEditable?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const StyleBoardEditor: React.FC<StyleBoardEditorProps> = ({
  visionNote,
  onVisionNoteChange,
  palette,
  onPaletteChange: _onPaletteChange,
  items,
  onAddItem,
  onRemoveItem,
  onShare,
  isEditable = true,
  style,
  testID,
}) => (
  <ScrollView
    style={[styles.root, style]}
    contentContainerStyle={styles.content}
    testID={testID}
  >
    {/* Vision Note */}
    <Text style={styles.sectionTitle}>Vision Note</Text>
    <TextInput
      style={[styles.textArea, !isEditable && styles.readOnly]}
      value={visionNote}
      onChangeText={onVisionNoteChange}
      placeholder="Describe the styling vision..."
      placeholderTextColor={T.muted}
      multiline
      editable={isEditable}
      textAlignVertical="top"
    />

    {/* Colour Palette */}
    <Text style={styles.sectionTitle}>Colour Palette</Text>
    <View style={styles.paletteRow}>
      {palette.map((color, idx) => (
        <View key={idx} style={styles.swatchWrap}>
          <View style={[styles.swatch, { backgroundColor: color }]} />
          <Text style={styles.swatchHex}>
            {color.toUpperCase()}
          </Text>
        </View>
      ))}
      {palette.length === 0 && (
        <Text style={styles.emptyText}>No colours added</Text>
      )}
    </View>

    {/* Image Grid */}
    <Text style={styles.sectionTitle}>Board</Text>
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.id} style={styles.gridItem}>
          <Image source={{ uri: item.imageUri }} style={styles.gridImage} />
          {item.label ? (
            <Text style={styles.gridLabel} numberOfLines={1}>
              {item.label}
            </Text>
          ) : null}
          {isEditable && onRemoveItem ? (
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemoveItem(item.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Icon name="close" size={12} color={T.white} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}

      {isEditable && onAddItem ? (
        <TouchableOpacity style={styles.addItem} onPress={onAddItem}>
          <Icon name="plus" size={24} color={T.purple} />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      ) : null}
    </View>

    {/* Share */}
    {onShare ? (
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={onShare}
        activeOpacity={0.8}
      >
        <Icon name="send" size={16} color={T.white} />
        <Text style={styles.shareBtnText}>Share Board</Text>
      </TouchableOpacity>
    ) : null}
  </ScrollView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.heading,
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  textArea: {
    backgroundColor: T.s1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    fontFamily: F.sans,
    color: T.ink,
    lineHeight: 21,
  },
  readOnly: {
    backgroundColor: T.s2,
    opacity: 0.8,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatchWrap: {
    alignItems: 'center',
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: T.border,
  },
  swatchHex: {
    marginTop: 4,
    fontSize: 9,
    fontFamily: F.sans,
    color: T.dim,
    letterSpacing: 0.3,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: F.sans,
    color: T.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: T.s2,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    fontSize: 10,
    fontFamily: F.sans,
    color: T.white,
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: T.purple + '44',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.purpleBg,
  },
  addText: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.purple,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: T.purple,
    borderRadius: RADIUS.md,
    marginTop: 24,
    gap: 8,
    ...SHADOW.card,
  },
  shareBtnText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
});
