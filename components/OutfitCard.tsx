import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { OutfitPostWithItems } from '../types/outfit';
import { useSocial } from '../hooks/useSocial';
import { formatDate } from '../utils/format';
import ItemTag from './ItemTag';

interface Props {
  post: OutfitPostWithItems;
  currentUserId: string | null;
}

export default function OutfitCard({ post, currentUserId }: Props) {
  const router = useRouter();
  const { likeCount, isLiked, comments, handleToggleLike } = useSocial(
    post.id,
    currentUserId
  );

  return (
    <View style={styles.card}>
      {/* ── User row ── */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          {post.user.avatar_url ? (
            <Image source={{ uri: post.user.avatar_url }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
        <View style={styles.userMeta}>
          <Text style={styles.username}>{post.user.username}</Text>
          <Text style={styles.timestamp}>{formatDate(post.created_at)}</Text>
        </View>
      </View>

      {/* ── Outfit image ── */}
      <Image
        source={{ uri: post.image_url }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* ── Caption ── */}
      {post.caption ? (
        <Text style={styles.caption}>{post.caption}</Text>
      ) : null}

      {/* ── Item tags ── */}
      {post.items.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagRow}
          contentContainerStyle={styles.tagRowContent}
        >
          {post.items.map(item => (
            <ItemTag key={item.id} label={item.name} />
          ))}
        </ScrollView>
      )}

      {/* ── Action row (likes + comments) ── */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.action} onPress={handleToggleLike}>
          <Text style={[styles.actionIcon, isLiked && styles.liked]}>♥</Text>
          <Text style={styles.actionCount}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={() =>
            router.push({ pathname: '/outfit/comments', params: { postId: post.id } })
          }
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{comments.length}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: '#e5e5e5',
  },
  avatarImg: {
    width: 36,
    height: 36,
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#d4d4d4',
  },
  userMeta: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#f0f0f0',
  },
  caption: {
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 12,
    paddingTop: 10,
    lineHeight: 20,
  },
  tagRow: {
    paddingTop: 8,
  },
  tagRowContent: {
    paddingHorizontal: 12,
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 20,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionIcon: {
    fontSize: 20,
    color: '#aaa',
  },
  liked: {
    color: '#e03e3e',
  },
  actionCount: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
});
