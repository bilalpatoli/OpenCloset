import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../utils/theme';

interface HeaderProps {
  title: string;
  eyebrow?: string;
  index?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export default function Header({
  title,
  eyebrow,
  index,
  showBack,
  onBack,
  right,
  style,
}: HeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            hitSlop={10}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}

        {index && <Text style={styles.index}>{index}</Text>}

        <View style={styles.rightSlot}>{right}</View>
      </View>

      <View style={styles.titleBlock}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  iconPlaceholder: { width: 36, height: 36 },
  rightSlot: {
    minWidth: 36,
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  index: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.accent,
    letterSpacing: 1.5,
  },
  titleBlock: { marginTop: spacing.sm },
  eyebrow: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 32,
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
});
