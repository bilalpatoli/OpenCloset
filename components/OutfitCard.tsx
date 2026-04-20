import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../utils/theme';
import ItemTag from './ItemTag';
import type { OutfitPostWithItems } from '../types/outfit';

interface OutfitCardProps {
  outfit: OutfitPostWithItems;
  onPress?: () => void;
  onDelete?: () => void;
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function OutfitCard({ outfit, onPress, onDelete }: OutfitCardProps) {
  const router = useRouter();
  const username = outfit.user?.username ?? 'anonymous';
  const initial = username.charAt(0).toUpperCase();
  const itemCount = outfit.items?.length ?? 0;
  const displayItems = (outfit.items ?? []).slice(0, 3);

  function handleUsernamePress() {
    router.push(`/profile/${outfit.user_id}`);
  }

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.authorRow}
          activeOpacity={0.7}
          onPress={handleUsernamePress}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.meta}>{formatRelative(outfit.created_at)}</Text>
          </View>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={15} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.imageFrame}>
        {outfit.image_url ? (
          <Image source={{ uri: outfit.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="shirt-outline" size={36} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.imageBadge}>
          <Text style={styles.imageBadgeText}>
            {itemCount} {itemCount === 1 ? 'piece' : 'pieces'}
          </Text>
        </View>
      </View>

      {outfit.caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {outfit.caption}
        </Text>
      ) : null}

      {displayItems.length > 0 && (
        <View style={styles.tagRow}>
          {displayItems.map((item) => (
            <ItemTag key={item.id} label={item.name || item.category} size="sm" />
          ))}
          {itemCount > displayItems.length && (
            <ItemTag label={`+${itemCount - displayItems.length}`} size="sm" variant="outline" />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deleteBtn: { padding: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatarInitial: {
    fontFamily: typography.display,
    fontSize: 16,
    color: colors.text,
  },
  username: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.1,
  },
  meta: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  indexMark: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.accent,
    letterSpacing: 1,
  },
  imageFrame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  image: { width: '100%', aspectRatio: 4 / 5, resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imageBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(26, 26, 26, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  imageBadgeText: {
    fontFamily: typography.body,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  caption: {
    fontFamily: typography.serif,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
