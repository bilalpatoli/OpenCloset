import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../../components/Header';
import OutfitCard from '../../components/OutfitCard';
import { useFeed } from '../../hooks/useFeed';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../utils/theme';

export default function FeedScreen() {
  const { outfits } = useFeed();
  const { userId } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const headerRight = (
    <TouchableOpacity
      hitSlop={10}
      style={styles.iconBtn}
      onPress={() => router.push('/(tabs)/camera')}
    >
      <Ionicons name="add" size={22} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.cardWrapper}>
            <OutfitCard outfit={item} index={index} currentUserId={userId} />
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
            <Header
              index="NO. 01"
              eyebrow="Daily Edit"
              title="The Feed"
              right={headerRight}
            />
            <View style={styles.divider}>
              <Text style={styles.dividerLabel}>Recent looks</Text>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerCount}>
                {String(outfits.length).padStart(2, '0')}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          outfits.length === 0 && !refreshing ? (
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={28} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No looks yet</Text>
              <Text style={styles.emptyBody}>
                Pull to refresh, or capture your first outfit from the Capture tab.
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
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  dividerLabel: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerCount: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.accent,
  },
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
