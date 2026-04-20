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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ClosetGrid from '../../components/ClosetGrid';
import { fetchUserProfile } from '../../services/users';
import { fetchOutfitsByUser } from '../../services/outfits';
import { fetchCloset } from '../../services/closet';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../../utils/constants';
import { colors, radius, spacing, typography } from '../../utils/theme';
import type { UserProfile } from '../../types/user';
import type { OutfitPostWithItems } from '../../types/outfit';
import type { ClosetItem } from '../../types/closet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const LOOK_ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;

type Filter = 'all' | ClothingCategory;

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetchUserProfile(userId),
      fetchOutfitsByUser(userId),
      fetchCloset(userId),
    ])
      .then(([p, o, c]) => {
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
  const recentOutfits = outfits.slice(0, 6);

  const HeaderBlock = (
    <View>
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.pageTitleOverlay} pointerEvents="none">
            <Text style={styles.pageIndex}>Closet</Text>
          </View>
          <View style={styles.iconBtnPlaceholder} />
        </View>
      </View>

      {/* Profile row */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.profileInfo}>
          {username ? <Text style={styles.username}>@{username}</Text> : null}
        </View>
      </View>

      {/* Stats card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>
            {String(closetItems.length).padStart(2, '0')}
          </Text>
          <Text style={styles.summaryLabel}>Pieces</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>
            {String(outfits.length).padStart(2, '0')}
          </Text>
          <Text style={styles.summaryLabel}>Looks</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>
            {String(Object.keys(counts).filter((k) => k !== 'all' && counts[k] > 0).length).padStart(2, '0')}
          </Text>
          <Text style={styles.summaryLabel}>Categories</Text>
        </View>
      </View>

      {/* Recent Looks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Recent looks</Text>
        <View style={styles.sectionLine} />
      </View>

      {recentOutfits.length > 0 ? (
        <View style={styles.looksGrid}>
          {recentOutfits.map((outfit, idx) => (
            <View key={outfit.id} style={[styles.lookCard, { width: LOOK_ITEM_WIDTH }]}>
              <View style={styles.lookImgFrame}>
                {outfit.image_url ? (
                  <Image source={{ uri: outfit.image_url }} style={styles.lookImg} />
                ) : (
                  <View style={styles.lookFallback}>
                    <Ionicons name="shirt-outline" size={24} color={colors.textTertiary} />
                  </View>
                )}
                <Text style={styles.lookIndex}>
                  {String(idx + 1).padStart(2, '0')}
                </Text>
              </View>
              <Text style={styles.lookMeta}>
                {outfit.items.length} {outfit.items.length === 1 ? 'piece' : 'pieces'}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyLooks}>
          <Ionicons name="image-outline" size={22} color={colors.textTertiary} />
          <Text style={styles.emptyLooksText}>No looks yet</Text>
        </View>
      )}

      {/* Wardrobe section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Wardrobe</Text>
        <View style={styles.sectionLine} />
      </View>

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
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ClosetGrid
        items={filtered}
        ListHeaderComponent={HeaderBlock}
        emptyMessage={
          filter === 'all'
            ? `${username}'s closet is empty.`
            : `Nothing in ${filter} yet.`
        }
      />
    </SafeAreaView>
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
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
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
  iconBtnPlaceholder: { width: 36 },
  pageTitleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageIndex: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.accent,
    letterSpacing: 1.5,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
  profileInfo: { flex: 1, gap: 6 },
  username: {
    fontFamily: typography.display,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.3,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  summaryCol: { flex: 1, alignItems: 'center', gap: 4 },
  summaryDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  summaryValue: {
    fontFamily: typography.display,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  looksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  lookCard: { gap: 8 },
  lookImgFrame: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    position: 'relative',
  },
  lookImg: { width: '100%', aspectRatio: 3 / 4, resizeMode: 'cover' },
  lookFallback: {
    width: '100%',
    aspectRatio: 3 / 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookIndex: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 11,
    color: colors.white,
    backgroundColor: 'rgba(26,26,26,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  lookMeta: {
    fontFamily: typography.body,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  emptyLooks: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyLooksText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  chipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
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
});
