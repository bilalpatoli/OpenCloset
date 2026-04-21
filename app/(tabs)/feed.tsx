import React, { useCallback, useState } from 'react';
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
import { useFeed } from '../../hooks/useFeed';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography } from '../../utils/theme';

type FeedMode = 'forYou' | 'following';

export default function FeedScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<FeedMode>('forYou');
  const [refreshing, setRefreshing] = useState(false);

  const { outfits, deleteOutfit, refetch } = useFeed(mode, userId ?? undefined);

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
      onPress={() => router.push('/(tabs)/camera')}
    >
      <Ionicons name="add" size={22} color={colors.text} />
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

  const emptyMessage =
    mode === 'following'
      ? 'Follow people to see their looks here.'
      : 'Pull to refresh, or capture your first outfit from the Capture tab.';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <OutfitCard
              outfit={item}
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
              <Text style={styles.emptyBody}>{emptyMessage}</Text>
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
