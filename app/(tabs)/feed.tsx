import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import OutfitCard from '../../components/OutfitCard';
import CommentsSheet from '../../components/CommentsSheet';
import { useFeed } from '../../hooks/useFeed';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { fetchUserLikes, likePost, unlikePost } from '../../services/likes';
import { colors, spacing, typography } from '../../utils/theme';

type FeedMode = 'forYou' | 'following';

export default function FeedScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications(userId);
  const [mode, setMode] = useState<FeedMode>('forYou');
  const [refreshing, setRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const fetchedLikeIds = useRef<Set<string>>(new Set());

  const { outfits, deleteOutfit, refetch } = useFeed(mode, userId ?? undefined);

  // Only fetch liked status for post IDs we haven't seen yet — never overwrite optimistic state
  React.useEffect(() => {
    if (!userId || outfits.length === 0) return;
    const newIds = outfits.map((o) => o.id).filter((id) => !fetchedLikeIds.current.has(id));
    if (newIds.length === 0) return;
    fetchUserLikes(newIds, userId)
      .then((liked) => {
        newIds.forEach((id) => fetchedLikeIds.current.add(id));
        setLikedPosts((prev) => new Set([...prev, ...liked]));
      })
      .catch(console.error);
  }, [userId, outfits]);

  function getCommentCount(postId: string, fallback?: number): number {
    return commentCounts[postId] ?? fallback ?? 0;
  }

  function getLikeCount(postId: string, fallback?: number): number {
    return likeCounts[postId] ?? fallback ?? 0;
  }

  function handleCommentAdded(postId: string) {
    setCommentCounts((prev) => {
      const current = prev[postId] ?? outfits.find((o) => o.id === postId)?.comment_count ?? 0;
      return { ...prev, [postId]: current + 1 };
    });
  }

  function handleLikePress(postId: string) {
    const isLiked = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setLikeCounts((prev) => {
      const current = prev[postId] ?? outfits.find((o) => o.id === postId)?.like_count ?? 0;
      return { ...prev, [postId]: Math.max(0, current + (isLiked ? -1 : 1)) };
    });
    (isLiked ? unlikePost(postId) : likePost(postId)).catch(() => {
      setLikedPosts((prev) => {
        const next = new Set(prev);
        isLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setLikeCounts((prev) => {
        const current = prev[postId] ?? 0;
        return { ...prev, [postId]: Math.max(0, current + (isLiked ? 1 : -1)) };
      });
    });
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const headerRight = (
    <TouchableOpacity
      hitSlop={10}
      style={styles.iconBtn}
      onPress={() => router.push('/notifications')}
    >
      <Ionicons name="notifications-outline" size={22} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : String(unreadCount)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const TabSwitcher = (
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tab, mode === 'forYou' && styles.tabActive]}
        onPress={() => setMode('forYou')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabLabel, mode === 'forYou' && styles.tabLabelActive]}>
          For You
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, mode === 'following' && styles.tabActive]}
        onPress={() => setMode('following')}
        activeOpacity={0.8}
      >
        <Text style={[styles.tabLabel, mode === 'following' && styles.tabLabelActive]}>
          Following
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <OutfitCard
              outfit={item}
              commentCount={getCommentCount(item.id, item.comment_count)}
              likeCount={getLikeCount(item.id, item.like_count)}
              liked={likedPosts.has(item.id)}
              onPress={() => router.push(`/outfit/${item.id}`)}
              onLikePress={() => handleLikePress(item.id)}
              onCommentPress={() => setActivePostId(item.id)}
              onDelete={
                item.user_id === userId
                  ? () => {
                      Alert.alert(
                        'Remove this look?',
                        'It will be deleted from the feed.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () =>
                              deleteOutfit(item.id).catch(() =>
                                Alert.alert('Error', 'Could not delete this look.')
                              ),
                          },
                        ]
                      );
                    }
                  : undefined
              }
            />
          </View>
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View>
            <Header index="Feed" right={headerRight} />
            {TabSwitcher}
          </View>
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={28} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>
                {mode === 'following' ? 'Nothing here yet' : 'No looks yet'}
              </Text>
              <Text style={styles.emptyBody}>
                {mode === 'following'
                  ? 'Follow people to see their looks here.'
                  : 'Pull to refresh, or capture your first outfit from the Capture tab.'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          outfits.length > 0 ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>— End of edit —</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      <CommentsSheet
        postId={activePostId}
        onClose={() => setActivePostId(null)}
        onCommentAdded={handleCommentAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xxxl },
  cardWrapper: { paddingHorizontal: spacing.lg },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    fontFamily: typography.body,
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 12,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.text },
  tabLabel: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  tabLabelActive: { color: colors.text },
  empty: {
    marginTop: spacing.xxxl,
    alignItems: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: 20,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 260,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  footerText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
});
