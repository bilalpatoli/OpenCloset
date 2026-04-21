import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../utils/theme';
import { fetchOutfitPost, deleteOutfitPost } from '../../services/outfits';
import { fetchComments, addComment, deleteComment } from '../../services/comments';
import { likePost, unlikePost, fetchUserLikes } from '../../services/likes';
import { useAuth } from '../../hooks/useAuth';
import ItemTag from '../../components/ItemTag';
import type { OutfitPostWithItems } from '../../types/outfit';
import type { Comment } from '../../types/comment';
import type { ClosetItem } from '../../types/closet';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

function PostVideo({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = true; p.muted = true; p.play(); });
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />;
}

function WardrobeItemCard({ item }: { item: ClosetItem }) {
  return (
    <View style={styles.wardrobeCard}>
      <View style={styles.wardrobeThumbnail}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.wardrobeImg} />
        ) : (
          <Ionicons name="shirt-outline" size={24} color={colors.textTertiary} />
        )}
      </View>
      <Text style={styles.wardrobeName} numberOfLines={2}>{item.name}</Text>
      <ItemTag label={item.category} size="sm" variant="muted" />
    </View>
  );
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [post, setPost] = useState<OutfitPostWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all([fetchOutfitPost(postId), fetchComments(postId)])
      .then(([p, c]) => {
        if (cancelled) return;
        setPost(p);
        setLikeCount(p.like_count ?? 0);
        setComments(c);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [postId]);

  useEffect(() => {
    if (!postId || !userId) return;
    fetchUserLikes([postId], userId)
      .then((likedSet) => setLiked(likedSet.has(postId)))
      .catch(console.error);
  }, [postId, userId]);

  const handleLike = useCallback(() => {
    if (!postId) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => Math.max(0, c + (wasLiked ? -1 : 1)));
    (wasLiked ? unlikePost(postId) : likePost(postId)).catch(() => {
      setLiked(wasLiked);
      setLikeCount((c) => Math.max(0, c + (wasLiked ? 1 : -1)));
    });
  }, [postId, liked]);

  const handleSubmitComment = useCallback(async () => {
    if (!postId || !commentText.trim() || submitting) return;
    const body = commentText.trim();
    setCommentText('');
    setSubmitting(true);
    try {
      const newComment = await addComment(postId, body);
      setComments((prev) => [...prev, newComment]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setCommentText(body);
    } finally {
      setSubmitting(false);
    }
  }, [postId, commentText, submitting]);

  const handleDeleteComment = useCallback((commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    deleteComment(commentId).catch(console.error);
  }, []);

  const handleDeletePost = useCallback(() => {
    if (!postId) return;
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteOutfitPost(postId);
              router.back();
            } catch {
              Alert.alert('Error', 'Could not delete this post.');
            }
          },
        },
      ]
    );
  }, [postId, router]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtnAbs} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Post not found.</Text>
      </View>
    );
  }

  const username = post.user?.username ?? 'anonymous';
  const initial = username.charAt(0).toUpperCase();
  const isOwnPost = post.user_id === userId;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ height: insets.top, backgroundColor: colors.background }} />

        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          {isOwnPost ? (
            <TouchableOpacity style={styles.headerBtn} onPress={handleDeletePost} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.xl) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero media */}
          <View style={styles.imageFrame}>
            {post.media_type === 'video' && post.video_url ? (
              <PostVideo uri={post.video_url} style={styles.image} />
            ) : post.image_url ? (
              <Image source={{ uri: post.image_url }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]}>
                <Ionicons name="shirt-outline" size={48} color={colors.textTertiary} />
              </View>
            )}
            {(post.items?.length ?? 0) > 0 && (
              <View style={styles.imageBadge}>
                <Text style={styles.imageBadgeText}>
                  {post.items.length} {post.items.length === 1 ? 'piece' : 'pieces'}
                </Text>
              </View>
            )}
          </View>

          {/* Author */}
          <View style={styles.authorSection}>
            <TouchableOpacity
              style={styles.authorRow}
              activeOpacity={0.7}
              onPress={() => router.push(`/profile/${post.user_id}`)}
            >
              <View style={styles.avatar}>
                {post.user?.avatar_url ? (
                  <Image source={{ uri: post.user.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
              </View>
              <View>
                <Text style={styles.username}>@{username}</Text>
                <Text style={styles.dateText}>{formatDate(post.created_at)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          {post.caption ? (
            <View style={styles.captionSection}>
              <Text style={styles.caption}>{post.caption}</Text>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={22}
                color={liked ? '#E53935' : colors.textSecondary}
              />
              <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>
                {likeCount} {likeCount === 1 ? 'like' : 'likes'}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.actionCount}>
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </Text>
            </View>
          </View>

          {/* Wardrobe */}
          {post.items && post.items.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.wardrobeSection}>
                <Text style={[styles.sectionLabel, { paddingHorizontal: spacing.lg }]}>Wardrobe</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.wardrobeScroll}
                >
                  {post.items.map((item) => (
                    <WardrobeItemCard key={item.id} item={item} />
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Comments */}
          <View style={styles.divider} />
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Comments</Text>
            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>No comments yet. Be the first.</Text>
              </View>
            ) : (
              comments.map((comment) => {
                const cInitial = (comment.user?.username ?? 'A').charAt(0).toUpperCase();
                const isOwn = comment.user_id === userId;
                return (
                  <View key={comment.id} style={styles.commentRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => router.push(`/profile/${comment.user_id}`)}
                    >
                      <View style={styles.commentAvatar}>
                        {comment.user?.avatar_url ? (
                          <Image
                            source={{ uri: comment.user.avatar_url }}
                            style={styles.avatarImg}
                          />
                        ) : (
                          <Text style={styles.commentAvatarInitial}>{cInitial}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.commentContent}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentUsername}>
                          {comment.user?.username ?? 'anonymous'}
                        </Text>
                        <Text style={styles.commentTime}>{timeAgo(comment.created_at)}</Text>
                      </View>
                      <Text style={styles.commentBody}>{comment.body}</Text>
                    </View>
                    {isOwn && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(comment.id)}
                        hitSlop={8}
                        style={styles.commentDelete}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Sticky comment input */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textTertiary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit
            onSubmitEditing={handleSubmitComment}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            hitSlop={8}
            style={styles.sendBtn}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={commentText.trim() ? colors.accent : colors.textTertiary}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  backBtnAbs: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: typography.body,
    fontSize: 15,
    color: colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.display,
    fontSize: 17,
    color: colors.text,
  },

  imageFrame: {
    position: 'relative',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: 'rgba(26, 26, 26, 0.78)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  imageBadgeText: {
    fontFamily: typography.body,
    fontSize: 10,
    color: colors.white,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },

  authorSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarInitial: {
    fontFamily: typography.display,
    fontSize: 18,
    color: colors.text,
  },
  username: {
    fontFamily: typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dateText: {
    fontFamily: typography.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  captionSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  caption: {
    fontFamily: typography.serif,
    fontSize: 15,
    color: colors.text,
    lineHeight: 24,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionCountLiked: { color: '#E53935' },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  section: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sectionLabel: {
    fontFamily: typography.body,
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },

  wardrobeSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  wardrobeScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  wardrobeCard: {
    width: 100,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  wardrobeThumbnail: {
    width: 100,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  wardrobeImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  wardrobeName: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 16,
  },

  emptyComments: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyCommentsText: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    flexShrink: 0,
  },
  commentAvatarInitial: {
    fontFamily: typography.display,
    fontSize: 13,
    color: colors.text,
  },
  commentContent: { flex: 1 },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  commentUsername: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  commentTime: {
    fontFamily: typography.body,
    fontSize: 11,
    color: colors.textTertiary,
  },
  commentBody: {
    fontFamily: typography.body,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  commentDelete: { paddingTop: 4 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
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
    maxHeight: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sendBtn: {
    paddingBottom: spacing.sm,
  },
});
