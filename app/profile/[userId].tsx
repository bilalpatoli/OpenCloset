import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchUserProfile } from '../../services/users';
import { fetchOutfitsByUser } from '../../services/outfits';
import { fetchCloset } from '../../services/closet';
import { useAuth } from '../../hooks/useAuth';
import { useFollow } from '../../hooks/useFollow';
import FollowButton from '../../components/FollowButton';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../../utils/constants';
import { colors, radius, spacing, typography } from '../../utils/theme';
import type { UserProfile } from '../../types/user';
import type { OutfitPostWithItems } from '../../types/outfit';
import type { ClosetItem } from '../../types/closet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const WARDROBE_PAD = spacing.lg;
const WARDROBE_GAP = spacing.sm;
const WARDROBE_TILE_WIDTH = (SCREEN_WIDTH - WARDROBE_PAD * 2 - WARDROBE_GAP * 2) / 3;

type Filter = 'all' | ClothingCategory;
type Tab = 'posts' | 'wardrobe';

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { userId: currentUserId } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [activeTab, setActiveTab] = useState<Tab>('posts');

  const { following, counts: followCounts, loading: followLoading, toggle } = useFollow(
    userId,
    currentUserId ?? undefined
  );

  const isSelf = !!currentUserId && currentUserId === userId;

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetchUserProfile(userId),
      fetchOutfitsByUser(userId),
      fetchCloset(userId),
    ])
      .then(([p, { posts: o }, { items: c }]) => {
        setProfile(p);
        setOutfits(o);
        setClosetItems(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: closetItems.length };
    for (const cat of CLOTHING_CATEGORIES) map[cat] = 0;
    for (const item of closetItems) map[item.category] = (map[item.category] ?? 0) + 1;
    return map;
  }, [closetItems]);

  const filtered = useMemo(
    () => (filter === 'all' ? closetItems : closetItems.filter((i) => i.category === filter)),
    [closetItems, filter]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const username = profile?.username ?? 'unknown';
  const initial = username.charAt(0).toUpperCase() || '?';
  const listData: any[] = activeTab === 'posts' ? outfits : filtered;

  const HeaderBlock = (
    <View>
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderRow}>
          <TouchableOpacity
            hitSlop={10}
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.pageIndex}>{username ? `@${username}` : 'Profile'}</Text>
          <View style={styles.pageHeaderPlaceholder} />
        </View>
      </View>

      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.statsContainer}>
          {username ? <Text style={styles.profileName}>{username}</Text> : null}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{outfits.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{closetItems.length}</Text>
              <Text style={styles.statLabel}>Pieces</Text>
            </View>
            <TouchableOpacity style={styles.statCol} activeOpacity={0.7}>
              <Text style={styles.statValue}>{followCounts.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCol} activeOpacity={0.7}>
              <Text style={styles.statValue}>{followCounts.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {(profile?.bio || profile?.location) && (
        <View style={styles.profileMeta}>
          {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
          {profile?.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          ) : null}
        </View>
      )}

      {!isSelf && (
        <View style={styles.followRow}>
          <FollowButton
            following={following}
            loading={followLoading}
            onPress={() =>
              toggle().catch(() =>
                Alert.alert('Error', 'Could not update follow status.')
              )
            }
          />
        </View>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]}
          onPress={() => setActiveTab('posts')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'posts' ? 'grid' : 'grid-outline'}
            size={14}
            color={activeTab === 'posts' ? colors.text : colors.textTertiary}
          />
          <Text style={[styles.tabLabel, activeTab === 'posts' && styles.tabLabelActive]}>
            Posts
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'wardrobe' && styles.tabItemActive]}
          onPress={() => setActiveTab('wardrobe')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'wardrobe' ? 'shirt' : 'shirt-outline'}
            size={14}
            color={activeTab === 'wardrobe' ? colors.text : colors.textTertiary}
          />
          <Text style={[styles.tabLabel, activeTab === 'wardrobe' && styles.tabLabelActive]}>
            Wardrobe
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'posts' && <View style={{ height: spacing.md }} />}
      {activeTab === 'wardrobe' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <FilterChip
            label="All"
            count={counts.all}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          {CLOTHING_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              count={counts[cat] ?? 0}
              active={filter === cat}
              onPress={() => setFilter(cat)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  const emptyMessage =
    activeTab === 'posts'
      ? `${username} hasn't posted any looks yet.`
      : filter === 'all'
      ? `${username}'s closet is empty.`
      : `Nothing in ${filter} yet.`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        key={activeTab}
        data={listData}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListHeaderComponent={HeaderBlock}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={activeTab === 'posts' ? styles.postRow : styles.wardrobeRow}
        renderItem={({ item }) =>
          activeTab === 'posts' ? (
            <PostTile outfit={item as OutfitPostWithItems} />
          ) : (
            <WardrobeTile item={item as ClosetItem} />
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons
              name={activeTab === 'posts' ? 'image-outline' : 'shirt-outline'}
              size={28}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function PostTile({ outfit }: { outfit: OutfitPostWithItems }) {
  return (
    <TouchableOpacity style={styles.postTile} activeOpacity={0.9}>
      {outfit.image_url ? (
        <Image source={{ uri: outfit.image_url }} style={styles.postImg} />
      ) : (
        <View style={styles.postFallback}>
          <Ionicons name="image-outline" size={18} color={colors.textTertiary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function WardrobeTile({ item }: { item: ClosetItem }) {
  return (
    <View style={styles.wardrobeTile}>
      <View style={styles.wardrobeImgWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.wardrobeImg} />
        ) : (
          <View style={styles.wardrobeFallback}>
            <Ionicons name="shirt-outline" size={18} color={colors.textTertiary} />
          </View>
        )}
      </View>
      <Text style={styles.wardrobeName} numberOfLines={1}>
        {item.name || item.category}
      </Text>
    </View>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      <Text style={[styles.chipCount, active && styles.chipCountActive]}>
        {String(count).padStart(2, '0')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeLoading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
  },
  pageHeaderPlaceholder: { width: 36, height: 36 },
  pageIndex: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.accent,
    letterSpacing: 1.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: {
    fontFamily: typography.display,
    fontSize: 32,
    color: colors.text,
  },
  statsContainer: { flex: 1, gap: spacing.sm },
  profileName: {
    fontFamily: typography.display,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: { alignItems: 'flex-start', gap: 2 },
  statValue: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: 10,
    color: colors.textSecondary,
  },

  profileMeta: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  bioText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  locationText: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
  },

  followRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: colors.text },
  tabLabel: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    fontWeight: '600',
  },
  tabLabelActive: { color: colors.text },

  // Filter chips
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: {
    fontFamily: typography.body,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.text,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.white },
  chipCount: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.accent,
  },
  chipCountActive: { color: 'rgba(255,255,255,0.7)' },

  // Grid
  gridContent: { paddingBottom: spacing.xxxl },
  postRow: {
    gap: WARDROBE_GAP,
    paddingHorizontal: WARDROBE_PAD,
    marginBottom: WARDROBE_GAP,
  },
  postTile: {
    width: WARDROBE_TILE_WIDTH,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  postImg: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  postFallback: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wardrobeRow: {
    gap: WARDROBE_GAP,
    paddingHorizontal: WARDROBE_PAD,
    marginBottom: WARDROBE_GAP,
  },
  wardrobeTile: { width: WARDROBE_TILE_WIDTH, gap: 6 },
  wardrobeImgWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  wardrobeImg: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  wardrobeFallback: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  wardrobeName: {
    fontFamily: typography.body,
    fontSize: 10.5,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },

  // Empty state
  emptyCard: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  emptyText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
