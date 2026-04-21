import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { colors, radius, spacing, typography } from '../utils/theme';
import type { ActivityItem } from '../services/activityFeed';

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function actorAvatar(actor: ActivityItem['actor'], size = 42) {
  const initial = actor.username.charAt(0).toUpperCase();
  return actor.avatar_url ? (
    <Image source={{ uri: actor.avatar_url }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
  ) : (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

function NotificationRow({ item, onPress }: { item: ActivityItem; onPress: () => void }) {
  let message: string;
  let icon: React.ReactNode;

  if (item.type === 'follow') {
    message = 'started following you';
    icon = <Ionicons name="person-add" size={14} color={colors.accent} />;
  } else if (item.type === 'like') {
    message = 'liked your post';
    icon = <Ionicons name="heart" size={14} color="#E53935" />;
  } else {
    message = `commented: "${item.body.length > 40 ? item.body.slice(0, 40) + '…' : item.body}"`;
    icon = <Ionicons name="chatbubble" size={14} color={colors.textSecondary} />;
  }

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.75} onPress={onPress}>
      <View style={styles.avatarWrap}>
        {actorAvatar(item.actor)}
        <View style={styles.iconBadge}>{icon}</View>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowText} numberOfLines={2}>
          <Text style={styles.username}>@{item.actor.username}</Text>
          {'  '}{message}
        </Text>
        <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
      </View>
      {(item.type === 'like' || item.type === 'comment') && item.post_image_url ? (
        <Image source={{ uri: item.post_image_url }} style={styles.postThumb} />
      ) : null}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { items, loading, markSeen, refresh } = useNotifications(userId);

  useEffect(() => {
    markSeen();
  }, []);

  function handlePress(item: ActivityItem) {
    if (item.type === 'follow') {
      router.push(`/profile/${item.actor.id}`);
    } else {
      router.push(`/outfit/${item.post_id}`);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header showBack title="Notifications" />
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={() => handlePress(item)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: { resizeMode: 'cover' },
  avatarFallback: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: typography.display, fontSize: 16, color: colors.text },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  username: { fontWeight: '600' },
  time: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
  },
  postThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    resizeMode: 'cover',
    backgroundColor: colors.surface,
  },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.textSecondary,
  },
});
