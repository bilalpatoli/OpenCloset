import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, typography } from '../utils/theme';

interface ItemTagProps {
  label: string;
  variant?: 'default' | 'filled' | 'outline' | 'muted';
  size?: 'sm' | 'md';
  onPress?: () => void;
  style?: ViewStyle;
}

export default function ItemTag({
  label,
  variant = 'default',
  size = 'md',
  onPress,
  style,
}: ItemTagProps) {
  const Wrapper: any = onPress ? TouchableOpacity : View;

  const containerStyle = [
    styles.base,
    size === 'sm' ? styles.sizeSm : styles.sizeMd,
    variant === 'filled' && styles.filled,
    variant === 'outline' && styles.outline,
    variant === 'muted' && styles.muted,
    variant === 'default' && styles.default,
    style,
  ];
  const textStyle = [
    styles.textBase,
    size === 'sm' ? styles.textSm : styles.textMd,
    variant === 'filled' && styles.textFilled,
  ];

  return (
    <Wrapper style={containerStyle} onPress={onPress} activeOpacity={0.7}>
      <Text style={textStyle}>{label}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeSm: { paddingHorizontal: 10, paddingVertical: 4 },
  sizeMd: { paddingHorizontal: 14, paddingVertical: 7 },
  default: { backgroundColor: colors.surface },
  filled: { backgroundColor: colors.text },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  muted: { backgroundColor: colors.borderSoft },
  textBase: {
    fontFamily: typography.body,
    color: colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  textSm: { fontSize: 9.5 },
  textMd: { fontSize: 10.5 },
  textFilled: { color: colors.white },
});
