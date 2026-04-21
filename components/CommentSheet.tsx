import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { fetchComments, addComment, deleteComment } from '../services/outfits';
import { supabase } from '../services/supabase';
import { colors, radius, spacing, typography } from '../utils/theme';
import type { PostComment } from '../types/outfit';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
  return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

interface CommentSheetProps {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
}

export default function CommentSheet({ postId, visible, onClose }: CommentSheetProps) {
  const { userId } = useAuth();
  const [username, setUsername] = useState<string | undefined>();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (userId && !username) {
      supabase
        .from('users')
        .select('username')
        .eq('id', userId)
        .single()
        .then(({ data }) => setUsername(data?.username ?? undefined));
    }
  }, [userId]);

  useEffect(() => {
    if (visible && postId) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
      setLoading(true);
      fetchComments(postId)
        .then(setComments)
        .catch(() => {})
        .finally(() => setLoading(false));
      setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, postId]);

  async function handleSend() {
    if (!userId || !postId || !body.trim()) return;
    setSending(true);
    try {
      const comment = await addComment(postId, userId, body, username);
      setComments((prev) => [...prev, comment]);
      setBody('');
    } catch {
      Alert.alert('Error', 'Could not post comment.');
    } finally {
      setSending(false);
    }
  }

  function confirmDelete(commentId: string) {
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

  function handleClose() {
    setBody('');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Comments</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.user?.username ?? 'A').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.commentBody}>
                    <Text style={styles.commentUsername}>
                      @{item.user?.username ?? 'anonymous'}
                      <Text style={styles.commentText}> {item.body}</Text>
                    </Text>
                    <Text style={styles.commentMeta}>{formatRelative(item.created_at)}</Text>
                  </View>
                  {item.user_id === userId && (
                    <TouchableOpacity onPress={() => confirmDelete(item.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={13} color={colors.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No comments yet. Be the first.</Text>
              }
            />
          )}

          <View style={styles.inputRow}>
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
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.65,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexGrow: 1,
  },
  commentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatarText: {
    fontFamily: typography.display,
    fontSize: 12,
    color: colors.text,
  },
  commentBody: { flex: 1 },
  commentUsername: {
    fontFamily: typography.body,
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  commentText: {
    fontFamily: typography.body,
    fontWeight: '400',
    fontSize: 13,
    color: colors.text,
  },
  commentMeta: {
    fontFamily: typography.body,
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 3,
  },
  empty: {
    fontFamily: typography.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
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
