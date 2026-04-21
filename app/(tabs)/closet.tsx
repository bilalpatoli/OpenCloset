import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useCloset } from '../../hooks/useCloset';
import { fetchUserProfile, updateUserProfile } from '../../services/users';
import { fetchOutfitsByUser } from '../../services/outfits';
import { uploadAvatarImage } from '../../services/storage';
import { logout } from '../../services/auth';
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

export default function ClosetScreen() {
  const { userId, loading } = useAuth();
  const { items } = useCloset(userId);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchUserProfile(userId).then(setProfile).catch(console.error);
    fetchOutfitsByUser(userId).then(({ posts }) => setOutfits(posts)).catch(console.error);
  }, [userId]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const cat of CLOTHING_CATEGORIES) map[cat] = 0;
    for (const item of items) map[item.category] = (map[item.category] ?? 0) + 1;
    return map;
  }, [items]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter]
  );

  async function handleAvatarPress() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow photo library access to update your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    try {
      const url = await uploadAvatarImage(asset.base64!, mimeType, userId!);
      await updateUserProfile(userId!, { avatar_url: url });
      setProfile((prev) => prev ? { ...prev, avatar_url: url } : prev);
    } catch (err: any) {
      console.error('[avatar upload]', err);
      Alert.alert('Error', err?.message ?? 'Could not update profile picture. Please try again.');
    }
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/auth/login');
          } catch {
            Alert.alert('Error', 'Could not sign out. Please try again.');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const username = profile?.username ?? '';
  const initial = username.charAt(0).toUpperCase() || '?';
  const listData: any[] = activeTab === 'posts' ? outfits : filtered;

  const HeaderBlock = (
    <View>
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderRow}>
          <View style={styles.pageHeaderPlaceholder} />
          <Text style={styles.pageIndex}>{username ? `@${username}` : 'Closet'}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              hitSlop={10}
              style={styles.iconBtn}
              onPress={() => router.push('/(tabs)/camera')}
            >
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={10}
              style={styles.iconBtn}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.profileRow}>
        <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={11} color={colors.white} />
          </View>
        </TouchableOpacity>
        <View style={styles.statsContainer}>
          {username ? <Text style={styles.profileName}>{username}</Text> : null}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{outfits.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{items.length}</Text>
              <Text style={styles.statLabel}>Pieces</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>
                {outfits.filter((o) => o.items.length > 0).length}
              </Text>
              <Text style={styles.statLabel}>Looks</Text>
            </View>
          </View>
        </View>
      </View>

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
      ? 'No looks captured yet.'
      : filter === 'all'
      ? 'Your closet is empty — capture your first outfit.'
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
        contentContainerStyle={styles.wardrobeGridContent}
        columnWrapperStyle={
          activeTab === 'posts' ? styles.postRow : styles.wardrobeRow
        }
        renderItem={({ item }) =>
          activeTab === 'posts' ? (
            <PostTile outfit={item as OutfitPostWithItems} />
          ) : (
            <WardrobeTile
              item={item as ClosetItem}
              onPress={() =>
                router.push({
                  pathname: '/closet/item',
                  params: { id: (item as ClosetItem).id },
                })
              }
            />
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

function WardrobeTile({ item, onPress }: { item: ClosetItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.wardrobeTile} activeOpacity={0.85} onPress={onPress}>
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
    </TouchableOpacity>
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
  headerIcons: { flexDirection: 'row', gap: spacing.sm },
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
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
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
    fontSize: 20,
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.textSecondary,
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
  tabItemActive: {
    borderBottomColor: colors.text,
  },
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

  // Posts grid
  postGridContent: { paddingBottom: spacing.xxxl },
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

  // Wardrobe grid
  wardrobeGridContent: { paddingBottom: spacing.xxxl },
  wardrobeRow: {
    gap: WARDROBE_GAP,
    paddingHorizontal: WARDROBE_PAD,
    marginBottom: WARDROBE_GAP,
  },
  wardrobeTile: {
    width: WARDROBE_TILE_WIDTH,
    gap: 6,
  },
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
