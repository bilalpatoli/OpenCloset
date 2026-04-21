import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, Alert, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../utils/theme';
import ItemTag from './ItemTag';
import type { OutfitPostWithItems } from '../types/outfit';

interface OutfitCardProps {
  outfit: OutfitPostWithItems;
  commentCount?: number;
  likeCount?: number;
  liked?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  onCommentPress?: () => void;
  onLikePress?: () => void;
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

export default function OutfitCard({ outfit, commentCount, likeCount, liked, onPress, onDelete, onCommentPress, onLikePress }: OutfitCardProps) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const menuBtnRef = useRef<View>(null);
  const username = outfit.user?.username ?? 'anonymous';
  const initial = username.charAt(0).toUpperCase();
  const itemCount = outfit.items?.length ?? 0;
  const displayItems = (outfit.items ?? []).slice(0, 3);

  function handleUsernamePress() {
    router.push(`/profile/${outfit.user_id}`);
  }

  function handleDeletePress() {
    setMenuVisible(false);
    Alert.alert(
      'Delete Outfit',
      'Are you sure you want to delete this outfit?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
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
            {outfit.user?.avatar_url ? (
              <Image source={{ uri: outfit.user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <View>
            <Text style={styles.username}>@{username}</Text>
            <Text style={styles.meta}>{formatRelative(outfit.created_at)}</Text>
          </View>
        </TouchableOpacity>
        {onDelete && (
          <View ref={menuBtnRef}>
            <TouchableOpacity
              onPress={() => {
                menuBtnRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
                  const screenWidth = Dimensions.get('window').width;
                  setMenuPos({ top: pageY + height + 4, right: screenWidth - (pageX + width) });
                  setMenuVisible(true);
                });
              }}
              hitSlop={8}
              style={styles.menuBtn}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
            <Modal
              visible={menuVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setMenuVisible(false)}
            >
              <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
                <View style={[styles.menuPopup, { top: menuPos.top, right: menuPos.right }]}>
                  <TouchableOpacity style={styles.menuItem} onPress={handleDeletePress}>
                    <Ionicons name="trash-outline" size={16} color="#E53935" />
                    <Text style={styles.menuItemText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          </View>
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

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLikePress} activeOpacity={0.7}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={liked ? '#E53935' : colors.textSecondary}
          />
          {(likeCount ?? outfit.like_count ?? 0) > 0 && (
            <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>
              {likeCount ?? outfit.like_count}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          {(commentCount ?? outfit.comment_count ?? 0) > 0 && (
            <Text style={styles.actionCount}>
              {commentCount ?? outfit.comment_count}
            </Text>
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
  menuBtn: { padding: 4 },
  menuOverlay: { flex: 1 },
  menuPopup: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    minWidth: 120,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItemText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: '#E53935',
    fontWeight: '500',
  },
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
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionCountLiked: {
    color: '#E53935',
  },
});
