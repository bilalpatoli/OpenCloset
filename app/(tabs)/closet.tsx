import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import ClosetGrid from '../../components/ClosetGrid';
import { useAuth } from '../../hooks/useAuth';
import { useCloset } from '../../hooks/useCloset';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../../utils/constants';
import { colors, radius, spacing, typography } from '../../utils/theme';

type Filter = 'all' | ClothingCategory;

export default function ClosetScreen() {
  const { userId, loading } = useAuth();
  const { items } = useCloset(userId);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeLoading}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const headerRight = (
    <TouchableOpacity
      hitSlop={10}
      style={styles.iconBtn}
      onPress={() => router.push('/(tabs)/camera')}
    >
      <Ionicons name="add" size={22} color={colors.text} />
    </TouchableOpacity>
  );

  const HeaderBlock = (
    <View>
      <Header
        index="NO. 02"
        eyebrow="Your Wardrobe"
        title="The Closet"
        right={headerRight}
      />
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>
            {String(items.length).padStart(2, '0')}
          </Text>
          <Text style={styles.summaryLabel}>Pieces</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>
            {Object.keys(counts).filter((k) => k !== 'all' && counts[k] > 0).length}
          </Text>
          <Text style={styles.summaryLabel}>Categories</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValueSerif}>—</Text>
          <Text style={styles.summaryLabel}>Curated</Text>
        </View>
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
            ? 'Your closet is empty — capture your first outfit.'
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
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
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
  summaryValueSerif: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 24,
    color: colors.accent,
  },
  summaryLabel: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
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
