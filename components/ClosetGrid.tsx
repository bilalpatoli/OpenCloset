import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '../utils/theme';
import type { ClosetItem } from '../types/closet';

interface ClosetGridProps {
  items: ClosetItem[];
  onItemPress?: (item: ClosetItem) => void;
  emptyMessage?: string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export default function ClosetGrid({
  items,
  onItemPress,
  emptyMessage = 'Nothing here yet.',
  ListHeaderComponent,
}: ClosetGridProps) {
  const router = useRouter();

  const handlePress = (item: ClosetItem) => {
    if (onItemPress) return onItemPress(item);
    router.push({ pathname: '/closet/item', params: { id: item.id } });
  };

  const renderItem: ListRenderItem<ClosetItem> = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.tile, index % 2 === 0 ? styles.tileLeft : styles.tileRight]}
      activeOpacity={0.85}
      onPress={() => handlePress(item)}
    >
      <View style={styles.imageWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="shirt-outline" size={28} color={colors.textTertiary} />
          </View>
        )}
        <Text style={styles.tileIndex}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.tileInfo}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {item.name || item.category}
        </Text>
        {item.color ? <Text style={styles.color}>{item.color}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        {ListHeaderComponent as React.ReactElement}
        <View style={styles.emptyCard}>
          <Ionicons name="shirt-outline" size={28} color={colors.textTertiary} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={2}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.column}
      ListHeaderComponent={ListHeaderComponent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  grid: { paddingBottom: spacing.xxxl, gap: spacing.lg },
  column: { gap: spacing.md, paddingHorizontal: spacing.lg },
  tile: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tileLeft: {},
  tileRight: {},
  imageWrap: { position: 'relative', backgroundColor: colors.surface },
  image: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  tileIndex: {
    position: 'absolute',
    top: 8,
    right: 10,
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 12,
    color: colors.text,
    letterSpacing: 1,
  },
  tileInfo: { padding: spacing.md, gap: 2 },
  category: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  name: {
    fontFamily: typography.display,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.2,
  },
  color: { fontFamily: typography.body, fontSize: 11, color: colors.textTertiary },
  empty: {},
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
