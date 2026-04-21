import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { searchUsers } from '../../services/search';
import { fetchFeed } from '../../services/outfits';
import UserListItem from '../../components/UserListItem';
import { colors, radius, spacing, typography } from '../../utils/theme';
import type { UserProfile } from '../../types/user';
import type { OutfitPostWithItems } from '../../types/outfit';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TILE_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3;

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [explorePosts, setExplorePosts] = useState<OutfitPostWithItems[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingExplore, setLoadingExplore] = useState(true);

  useEffect(() => {
    fetchFeed({ limit: 30 })
      .then(({ posts }) => setExplorePosts(posts))
      .catch(console.error)
      .finally(() => setLoadingExplore(false));
  }, []);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setUsers([]);
      return;
    }
    setSearching(true);
    try {
      const { users: results } = await searchUsers(q);
      setUsers(results);
    } catch {
      setUsers([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const showResults = query.length >= 2;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchBarWrap}>
        <Ionicons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder="Search people…"
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {showResults ? (
        <FlatList
          key="search"
          data={users}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => <UserListItem user={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            searching ? (
              <ActivityIndicator style={styles.spinner} color={colors.accent} />
            ) : null
          }
          ListEmptyComponent={
            !searching ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No users found for &ldquo;{query}&rdquo;</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          key="explore"
          data={explorePosts}
          keyExtractor={(p) => p.id}
          numColumns={3}
          columnWrapperStyle={styles.tileRow}
          contentContainerStyle={styles.exploreGrid}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>Explore</Text>
          }
          ListEmptyComponent={
            loadingExplore ? (
              <ActivityIndicator style={styles.spinner} color={colors.accent} />
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No posts yet</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.tile}
              activeOpacity={0.85}
              onPress={() => router.push(`/profile/${item.user_id}`)}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.tileImg} />
              ) : (
                <View style={styles.tileFallback}>
                  <Ionicons name="image-outline" size={18} color={colors.textTertiary} />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 44 + spacing.md,
  },
  spinner: { marginTop: spacing.xl },
  sectionLabel: {
    fontFamily: typography.body,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  exploreGrid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  tileRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tile: {
    width: TILE_SIZE,
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tileImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  tileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    marginTop: spacing.xl,
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.textSecondary,
  },
});
