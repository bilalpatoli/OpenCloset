import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../utils/theme';
import type { UserProfile } from '../types/user';

interface Props {
  user: UserProfile;
}

export default function UserListItem({ user }: Props) {
  const router = useRouter();
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/profile/${user.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.initial}>{initial}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio ? (
          <Text style={styles.sub} numberOfLines={1}>{user.bio}</Text>
        ) : user.location ? (
          <Text style={styles.sub} numberOfLines={1}>{user.location}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  initial: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.text,
  },
  info: { flex: 1, gap: 3 },
  username: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  sub: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
