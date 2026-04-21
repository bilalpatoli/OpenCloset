import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '../utils/theme';

interface Props {
  following: boolean;
  loading?: boolean;
  onPress: () => void;
}

export default function FollowButton({ following, loading, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, following ? styles.btnFollowing : styles.btnFollow]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={following ? colors.textSecondary : colors.white}
        />
      ) : (
        <Text style={[styles.label, following ? styles.labelFollowing : styles.labelFollow]}>
          {following ? 'Following' : 'Follow'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 34,
  },
  btnFollow: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  btnFollowing: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  label: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelFollow: { color: colors.white },
  labelFollowing: { color: colors.textSecondary },
});
