import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Header from '../../components/Header';
import ItemTag from '../../components/ItemTag';
import { useAuth } from '../../hooks/useAuth';
import { fetchCloset, deleteClosetItem } from '../../services/closet';
import { colors, radius, spacing, typography } from '../../utils/theme';
import { formatDate } from '../../utils/format';
import type { ClosetItem } from '../../types/closet';

export default function ClosetItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useAuth();

  const [item, setItem] = useState<ClosetItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!userId || !id) return;
    fetchCloset(userId)
      .then(({ items }) => setItem(items.find((i) => i.id === id) ?? null))
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [userId, id]);

  function confirmDelete() {
    Alert.alert(
      'Remove this piece?',
      'It will be taken out of your closet.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: handleDelete },
      ]
    );
  }

  async function handleDelete() {
    if (!item) return;
    setDeleting(true);
    try {
      await deleteClosetItem(item.id);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not remove this item.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeCenter}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safeCenter}>
        <Header showBack title="Not Found" />
        <View style={styles.empty}>
          <Ionicons name="help-circle-outline" size={28} color={colors.textTertiary} />
          <Text style={styles.emptyText}>This item could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header
        showBack
        index="ARCHIVE"
        eyebrow={item.category.toUpperCase()}
        title={item.name || item.category}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageFrame}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.image} />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name="shirt-outline" size={44} color={colors.textTertiary} />
            </View>
          )}
          <View style={styles.imageCorner}>
            <Text style={styles.imageCornerText}>
              Filed {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label="Category" value={item.category} />
          <DetailRow label="Name" value={item.name || '—'} />
          {item.color ? <DetailRow label="Color" value={item.color} accent /> : null}
          <DetailRow label="Added" value={formatDate(item.created_at)} />
        </View>

        <View style={styles.tagsWrap}>
          <ItemTag label={item.category} />
          {item.color ? <ItemTag label={item.color} variant="outline" /> : null}
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          activeOpacity={0.9}
          onPress={confirmDelete}
          disabled={deleting}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.deleteBtnText}>
            {deleting ? 'Removing…' : 'Remove from Closet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {accent ? (
        <View style={styles.detailAccentRow}>
          <View style={styles.detailDot} />
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.detailValue}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeCenter: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.md,
  },
  imageFrame: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    position: 'relative',
  },
  image: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  imageFallback: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageCorner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(26,26,26,0.78)',
  },
  imageCornerText: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.white,
    fontWeight: '600',
  },
  detailsCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  detailLabel: {
    fontFamily: typography.body,
    fontSize: 10.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  detailValue: {
    fontFamily: typography.display,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.1,
  },
  detailAccentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.lg,
  },
  deleteBtn: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  btnDisabled: { opacity: 0.5 },
  deleteBtnText: {
    fontFamily: typography.body,
    color: colors.danger,
    fontSize: 13,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
