import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { T, F, RADIUS, SHADOW } from '../../constants/tokens';
import { Icon } from '../primitives/Icon';

/** Pipeline stage names matching the order flow */
export type PipelineStage =
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered';

const STAGE_ORDER: PipelineStage[] = [
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

const STAGE_LABEL: Record<PipelineStage, string> = {
  confirmed:  'Confirmed',
  processing: 'Processing',
  shipped:    'Shipped',
  delivered:  'Delivered',
};

interface PipelineControlsProps {
  currentStage: PipelineStage;
  onAdvance?: (nextStage: PipelineStage) => void;
  /** Disable all buttons (e.g. while loading) */
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const PipelineControls: React.FC<PipelineControlsProps> = ({
  currentStage,
  onAdvance,
  disabled = false,
  style,
  testID,
}) => {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const isLast = currentIdx >= STAGE_ORDER.length - 1;
  const nextStage = isLast ? null : STAGE_ORDER[currentIdx + 1];

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Stage indicators */}
      <View style={styles.stageRow}>
        {STAGE_ORDER.map((stage, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <View key={stage} style={styles.stageItem}>
              <View
                style={[
                  styles.stageCircle,
                  isDone && { backgroundColor: T.purple },
                  isCurrent && styles.stageCurrent,
                ]}
              >
                {isDone ? (
                  <Icon name="check" size={12} color={T.white} />
                ) : (
                  <Text style={styles.stageNum}>{idx + 1}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stageLabel,
                  isDone && { color: T.heading },
                ]}
              >
                {STAGE_LABEL[stage]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Advance button */}
      {nextStage && onAdvance ? (
        <TouchableOpacity
          style={[styles.advanceBtn, disabled && styles.advanceBtnDisabled]}
          onPress={() => onAdvance(nextStage)}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Text style={styles.advanceText}>
            Mark as {STAGE_LABEL[nextStage]}
          </Text>
          <Icon name="forward" size={16} color={T.white} />
        </TouchableOpacity>
      ) : (
        <View style={styles.completedRow}>
          <Icon name="check" size={16} color={T.success} />
          <Text style={styles.completedText}>Order Complete</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.cardBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    ...SHADOW.card,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stageItem: {
    alignItems: 'center',
    flex: 1,
  },
  stageCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: T.s3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stageCurrent: {
    borderWidth: 2,
    borderColor: T.purple + '66',
  },
  stageNum: {
    fontSize: 12,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.dim,
  },
  stageLabel: {
    fontSize: 10,
    fontFamily: F.sans,
    fontWeight: '500',
    color: T.dim,
    textAlign: 'center',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: T.purple,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    gap: 8,
  },
  advanceBtnDisabled: {
    opacity: 0.5,
  },
  advanceText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.white,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  completedText: {
    fontSize: 14,
    fontFamily: F.sans,
    fontWeight: '600',
    color: T.success,
  },
});
