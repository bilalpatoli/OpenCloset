import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchComments,
  addComment,
  deleteComment,
  likePost,
  unlikePost,
} from '../../services/outfits';
import { supabase } from '../../services/supabase';
import { colors, radius, spacing, typography } from '../../utils/theme';
import type { PostComment, OutfitPostWithItems } from '../../types/outfit';
import type { ClosetItem } from '../../types/closet';

function formatRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function PostVideo({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = true; p.muted = true; p.play(); });
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();

  const [post, setPost] = useState<OutfitPostWithItems | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!id) return;

    supabase
      .from('outfit_posts')
      .select(`*, user:users(username, avatar_url), outfit_items(closet_item:closet_items(*))`)
      .eq('id', id)
      .single()
      .then(async ({ data }) => {
        if (!data) return;
        const { data: likes } = await supabase
          .from('post_likes')
          .select('user_id')
          .eq('outfit_post_id', id);
        const count = likes?.length ?? 0;
        const liked = userId ? (likes ?? []).some((l) => l.user_id === userId) : false;
        setLikeCount(count);
        setLikedByMe(liked);
        setPost({
          id: data.id,
          user_id: data.user_id,
          image_url: data.image_url,
          caption: data.caption,
          created_at: data.created_at,
          user: data.user,
          items: (data.outfit_items ?? [])
            .map((oi: any) => oi.closet_item as ClosetItem)
            .filter(Boolean),
          likeCount: count,
          likedByMe: liked,
        });
      });

    fetchComments(id).then(setComments).catch(console.error);
  }, [id, userId]);

  async function handleLike() {
    if (!userId || !id) return;
    setLikedByMe((prev) => !prev);
    setLikeCount((prev) => (likedByMe ? prev - 1 : prev + 1));
    try {
      if (likedByMe) await unlikePost(id, userId);
      else await likePost(id, userId);
    } catch {
      setLikedByMe((prev) => !prev);
      setLikeCount((prev) => (likedByMe ? prev + 1 : prev - 1));
    }
  }

  async function handleSend() {
    if (!userId || !id || !body.trim()) return;
    setSending(true);
    try {
      const comment = await addComment(id, userId, body);
      setComments((prev) => [...prev, comment]);
      setBody('');
    } catch {
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setSending(false);
    }
  }

  function confirmDeleteComment(commentId: string) {
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch {
            Alert.alert('Error', 'Could not delete comment.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header showBack title={post?.user?.username ? `@${post.user.username}` : 'Look'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            post ? (
              <View>
                <View style={styles.imageFrame}>
                  {post.media_type === 'video' && post.video_url ? (
                    <PostVideo uri={post.video_url} style={styles.image} />
                  ) : (
                    <Image source={{ uri: post.image_url }} style={styles.image} />
                  )}
                </View>

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={handleLike} hitSlop={8}>
                    <Ionicons
                      name={likedByMe ? 'heart' : 'heart-outline'}
                      size={22}
                      color={likedByMe ? colors.danger : colors.textSecondary}
                    />
                    {likeCount > 0 && (
                      <Text style={[styles.actionCount, likedByMe && styles.actionCountActive]}>
                        {likeCount}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={() => inputRef.current?.focus()} hitSlop={8}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
                    {comments.length > 0 && (
                      <Text style={styles.actionCount}>{comments.length}</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {post.caption ? (
                  <View style={styles.captionRow}>
                    <Text style={styles.captionUser}>@{post.user?.username}</Text>
                    <Text style={styles.captionText}>{post.caption}</Text>
                  </View>
                ) : null}

                {comments.length > 0 && (
                  <Text style={styles.commentsLabel}>Comments</Text>
                )}
              </View>
            ) : (
              <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
            )
          }
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>
                  {(item.user?.username ?? 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.commentBody}>
                <Text style={styles.commentUsername}>@{item.user?.username ?? 'anonymous'}</Text>
                <Text style={styles.commentText}>{item.body}</Text>
                <Text style={styles.commentMeta}>{formatRelative(item.created_at)}</Text>
              </View>
              {item.user_id === userId && (
                <TouchableOpacity
                  onPress={() => confirmDeleteComment(item.id)}
                  hitSlop={8}
                  style={styles.commentDelete}
                >
                  <Ionicons name="trash-outline" size={13} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            post ? (
              <Text style={styles.noComments}>No comments yet. Be the first.</Text>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Add a comment…"
            placeholderTextColor={colors.textTertiary}
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !body.trim()}
            style={[styles.sendBtn, (!body.trim() || sending) && styles.sendBtnDisabled]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="arrow-up" size={16} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: spacing.xl },
  imageFrame: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  image: { width: '100%', aspectRatio: 4 / 5, resizeMode: 'cover' },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionCountActive: { color: colors.danger },
  captionRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexWrap: 'wrap',
  },
  captionUser: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  captionText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
  },
  commentsLabel: {
    fontFamily: typography.body,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  commentAvatarText: {
    fontFamily: typography.display,
    fontSize: 13,
    color: colors.text,
  },
  commentBody: { flex: 1 },
  commentUsername: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  commentText: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginTop: 1,
  },
  commentMeta: {
    fontFamily: typography.body,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 3,
  },
  commentDelete: { paddingTop: 4 },
  noComments: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
});
