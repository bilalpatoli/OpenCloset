import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSocial } from '../../hooks/useSocial';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/format';
import type { CommentWithUser } from '../../types/outfit';

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { userId } = useAuth();
  const { comments, loading, handleAddComment, handleDeleteComment } = useSocial(
    postId,
    userId
  );
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await handleAddComment(trimmed);
  }

  function confirmDelete(comment: CommentWithUser) {
    if (comment.user_id !== userId) return;
    Alert.alert('Delete comment', 'Remove this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDeleteComment(comment.id),
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={comments}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => confirmDelete(item)}
            activeOpacity={item.user_id === userId ? 0.6 : 1}
          >
            <View style={styles.comment}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>{item.user.username}</Text>
                <Text style={styles.commentTime}>{formatDate(item.created_at)}</Text>
              </View>
              <Text style={styles.commentBody}>{item.body}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Loading…' : 'No comments yet. Be the first!'}
          </Text>
        }
      />

      {/* Pinned input row above keyboard */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Add a comment…"
          placeholderTextColor="#aaa"
          value={text}
          onChangeText={setText}
          returnKeyType="send"
          onSubmitEditing={submit}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={submit}
          disabled={!text.trim()}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  comment: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111',
  },
  commentTime: {
    fontSize: 11,
    color: '#aaa',
  },
  commentBody: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 60,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  sendBtn: {
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderRadius: 20,
  },
  sendBtnDisabled: {
    backgroundColor: '#ccc',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
