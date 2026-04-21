import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../utils/theme';
import { fetchComments, addComment, deleteComment } from '../services/comments';
import type { Comment } from '../types/comment';
import { useAuth } from '../hooks/useAuth';

interface CommentsSheetProps {
  postId: string | null;
  onClose: () => void;
  onCommentAdded?: (postId: string) => void;
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

export default function CommentsSheet({ postId, onClose, onCommentAdded }: CommentsSheetProps) {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setText('');
      return;
    }
    setLoading(true);
    fetchComments(postId)
      .then(setComments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = useCallback(async () => {
    if (!postId || !text.trim() || submitting) return;
    const body = text.trim();
    setText('');
    setSubmitting(true);
    try {
      const newComment = await addComment(postId, body);
      setComments((prev) => [...prev, newComment]);
      onCommentAdded?.(postId);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setText(body);
    } finally {
      setSubmitting(false);
    }
  }, [postId, text, submitting, onCommentAdded]);

  const handleDelete = useCallback(async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    deleteComment(commentId).catch(console.error);
  }, []);

  return (
    <Modal
      visible={!!postId}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={comments}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptyBody}>Be the first to say something.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const initial = (item.user?.username ?? 'A').charAt(0).toUpperCase();
                const isOwn = item.user_id === userId;
                return (
                  <View style={styles.commentRow}>
                    <View style={styles.avatar}>
                      {item.user?.avatar_url ? (
                        <Image source={{ uri: item.user.avatar_url }} style={styles.avatarImg} />
                      ) : (
                        <Text style={styles.avatarInitial}>{initial}</Text>
                      )}
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentUsername}>
                          {item.user?.username ?? 'anonymous'}
                        </Text>
                        <Text style={styles.commentTime}>{timeAgo(item.created_at)}</Text>
                      </View>
                      <Text style={styles.commentBody}>{item.body}</Text>
                    </View>
                    {isOwn && (
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        hitSlop={8}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}

          <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textTertiary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSubmit}
            />
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!text.trim() || submitting}
              style={styles.sendBtn}
              hitSlop={8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={text.trim() ? colors.accent : colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const SHEET_HEIGHT = '75%';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: typography.display,
    fontSize: 16,
    color: colors.text,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontFamily: typography.display,
    fontSize: 16,
    color: colors.text,
  },
  emptyBody: {
    fontFamily: typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarInitial: {
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
  deleteBtn: { paddingTop: 2 },
  inputRow: {
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
