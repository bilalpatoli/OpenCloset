import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../utils/theme';

interface CameraButtonProps {
  label: string;
  variant?: 'primary' | 'ghost';
  icon?: 'camera' | 'image' | 'flash' | 'reload';
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const iconMap = {
  camera: 'camera-outline',
  image: 'images-outline',
  flash: 'flash-outline',
  reload: 'refresh-outline',
} as const;

export default function CameraButton({
  label,
  variant = 'primary',
  icon = 'camera',
  onPress,
  loading,
  disabled,
  style,
}: CameraButtonProps) {
  const isPrimary = variant === 'primary';
  const iconName = iconMap[icon];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? colors.white : colors.text} />
        ) : (
          <>
            <Ionicons
              name={iconName}
              size={18}
              color={isPrimary ? colors.white : colors.text}
            />
            <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.text },
  ghost: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: {
    fontFamily: typography.body,
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  labelPrimary: { color: colors.white },
  labelGhost: { color: colors.text },
});
