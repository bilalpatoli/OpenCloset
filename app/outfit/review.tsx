import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import { saveClosetItem } from '../../services/closet';
import { uploadOutfitImage } from '../../services/storage';
import type { DetectedItem } from '../../services/ai';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../../utils/constants';
import { colors, radius, spacing, typography } from '../../utils/theme';

interface EditableItem extends DetectedItem {
  key: string;
  confirmed: boolean;
}

export default function OutfitReviewScreen() {
  const { imageUri, items: itemsParam } = useLocalSearchParams<{
    imageUri: string;
    items: string;
  }>();
  const router = useRouter();
  const { userId } = useAuth();

  const [items, setItems] = useState<EditableItem[]>(() =>
    (JSON.parse(itemsParam ?? '[]') as DetectedItem[]).map((item, i) => ({
      ...item,
      key: String(i),
      confirmed: true,
    }))
  );
  const [saving, setSaving] = useState(false);

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  async function handleSave() {
    if (!userId) {
      Alert.alert('Not logged in', 'Please log in to save your outfit.');
      return;
    }
    const confirmed = items.filter((i) => i.confirmed);
    if (confirmed.length === 0) {
      Alert.alert('No items selected', 'Keep at least one item to save.');
      return;
    }

    setSaving(true);
    try {
      const imageUrl = await uploadOutfitImage(imageUri, userId);
      await Promise.all(
        confirmed.map((item) =>
          saveClosetItem({
            user_id: userId,
            name: item.name,
            category: item.category,
            color: item.color,
            image_url: imageUrl,
          })
        )
      );
      router.replace('/outfit/success');
    } catch {
      Alert.alert('Save failed', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const confirmedCount = items.filter((i) => i.confirmed).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        index="STEP 02"
        eyebrow="Review"
        title="Edit the cast"
        showBack
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {imageUri ? (
              <View style={styles.imageFrame}>
                <Image source={{ uri: imageUri }} style={styles.image} />
                <View style={styles.imageBadge}>
                  <Text style={styles.imageBadgeText}>
                    {confirmedCount}/{items.length} keeping
                  </Text>
                </View>
              </View>
            ) : null}
            <Text style={styles.sectionIntro}>
              Claude found <Text style={styles.sectionIntroAccent}>{items.length}</Text>{' '}
              {items.length === 1 ? 'piece' : 'pieces'}. Refine the details or dismiss
              anything out of place.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.textTertiary} />
            <Text style={styles.emptyText}>
              Nothing detected. Try a brighter, full-body photo.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ItemCard
            item={item}
            index={index}
            onUpdate={(patch) => updateItem(item.key, patch)}
          />
        )}
        ListFooterComponent={<View style={{ height: spacing.xxl }} />}
      />

      <View style={styles.bottomBar}>
        <View style={styles.bottomStat}>
          <Text style={styles.bottomStatValue}>
            {String(confirmedCount).padStart(2, '0')}
          </Text>
          <Text style={styles.bottomStatLabel}>Pieces to save</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, (saving || confirmedCount === 0) && styles.saveBtnDisabled]}
          activeOpacity={0.9}
          onPress={handleSave}
          disabled={saving || confirmedCount === 0}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Text style={styles.saveBtnText}>Save to Closet</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ItemCard({
  item,
  index,
  onUpdate,
}: {
  item: EditableItem;
  index: number;
  onUpdate: (patch: Partial<EditableItem>) => void;
}) {
  return (
    <View style={[cardStyles.card, !item.confirmed && cardStyles.cardDismissed]}>
      <View style={cardStyles.headRow}>
        <Text style={cardStyles.cardIndex}>{String(index + 1).padStart(2, '0')}</Text>
        <View style={cardStyles.headText}>
          <Text style={cardStyles.cardCategory}>{item.category}</Text>
          <TextInput
            style={cardStyles.nameInput}
            value={item.name}
            onChangeText={(text) => onUpdate({ name: text })}
            editable={item.confirmed}
            placeholder="Item name"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        <TouchableOpacity
          style={cardStyles.toggleBtn}
          onPress={() => onUpdate({ confirmed: !item.confirmed })}
          hitSlop={8}
        >
          <Ionicons
            name={item.confirmed ? 'close' : 'add'}
            size={16}
            color={item.confirmed ? colors.textSecondary : colors.white}
          />
        </TouchableOpacity>
      </View>

      {item.confirmed && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={cardStyles.chipRow}
          >
            {CLOTHING_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  cardStyles.chip,
                  item.category === cat && cardStyles.chipActive,
                ]}
                onPress={() => onUpdate({ category: cat as ClothingCategory })}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    cardStyles.chipText,
                    item.category === cat && cardStyles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {item.color ? (
            <View style={cardStyles.metaRow}>
              <View style={cardStyles.colorDot} />
              <Text style={cardStyles.metaText}>{item.color}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  imageFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    position: 'relative',
  },
  image: { width: '100%', aspectRatio: 4 / 5, resizeMode: 'cover' },
  imageBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(26,26,26,0.78)',
  },
  imageBadgeText: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.white,
    fontWeight: '600',
  },
  sectionIntro: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  sectionIntroAccent: {
    color: colors.accent,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bottomStat: { alignItems: 'flex-start' },
  bottomStatValue: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.5,
  },
  bottomStatLabel: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    paddingVertical: 16,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontFamily: typography.body,
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardDismissed: { opacity: 0.55, backgroundColor: colors.surface },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIndex: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: colors.accent,
    width: 30,
  },
  headText: { flex: 1 },
  cardCategory: {
    fontFamily: typography.body,
    fontSize: 9.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  nameInput: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.3,
    padding: 0,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  chipRow: { gap: 6, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.text },
  chipText: {
    fontFamily: typography.body,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: { color: colors.white },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  metaText: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
});
