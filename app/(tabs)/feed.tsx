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

export default function FeedScreen() {
  const { outfits, deleteOutfit } = useFeed();
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
            <OutfitCard
              outfit={item}
              index={index}
              onDelete={item.user_id === userId ? () => {
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
              } : undefined}
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
            <Header
              index="Feed"
              right={headerRight}
            />
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
