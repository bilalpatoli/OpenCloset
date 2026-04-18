import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography, shadow } from '../utils/theme';
import ItemTag from './ItemTag';
import { useSocial } from '../hooks/useSocial';
import type { OutfitPostWithItems } from '../types/outfit';

interface OutfitCardProps {
  outfit: OutfitPostWithItems;
  currentUserId: string | null;
  index?: number;
  onPress?: () => void;
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

export default function OutfitCard({ outfit, currentUserId, index, onPress }: OutfitCardProps) {
  const router = useRouter();
  const { likeCount, isLiked, comments, handleToggleLike } = useSocial(
    outfit.id,
    currentUserId
  );

  const username = outfit.user?.username ?? 'anonymous';
  const initial = username.charAt(0).toUpperCase();
  const itemCount = outfit.items?.length ?? 0;
  const displayItems = (outfit.items ?? []).slice(0, 3);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
      {/* ── Header row ── */}
      <View style={styles.headerRow}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <View>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.meta}>{formatRelative(outfit.created_at)}</Text>
          </View>
        </View>
        {typeof index === 'number' && (
          <Text style={styles.indexMark}>{String(index + 1).padStart(2, '0')}</Text>
        )}
      </View>

      {/* ── Outfit image ── */}
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

      {/* ── Caption ── */}
      {outfit.caption ? (
        <Text style={styles.caption} numberOfLines={2}>{outfit.caption}</Text>
      ) : null}

      {/* ── Item tags ── */}
      {displayItems.length > 0 && (
        <View style={styles.tagRow}>
          {displayItems.map(item => (
            <ItemTag key={item.id} label={item.name || item.category} size="sm" />
          ))}
          {itemCount > displayItems.length && (
            <ItemTag label={`+${itemCount - displayItems.length}`} size="sm" variant="outline" />
          )}
        </View>
      )}

      {/* ── Action row (likes + comments) ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.action}
          onPress={e => { e.stopPropagation?.(); handleToggleLike(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? colors.danger : colors.textTertiary}
          />
          {likeCount > 0 && <Text style={styles.actionCount}>{likeCount}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={e => {
            e.stopPropagation?.();
            router.push({ pathname: '/outfit/comments', params: { postId: outfit.id } });
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chatbubble-outline" size={19} color={colors.textTertiary} />
          {comments.length > 0 && (
            <Text style={styles.actionCount}>{comments.length}</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.body,
  },
  username: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    fontFamily: typography.body,
  },
  meta: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: typography.body,
    marginTop: 1,
  },
  indexMark: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: typography.mono,
    letterSpacing: 1,
  },
  imageFrame: {
    position: 'relative',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: colors.surface,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imageBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: typography.body,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.body,
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
    marginTop: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontWeight: '500',
  },
});
