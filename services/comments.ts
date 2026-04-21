import { supabase } from './supabase';
import type { Comment } from '../types/comment';

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, user:users(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Comment[];
}

export async function fetchCommentCounts(
  postIds: string[]
): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};

  const { data, error } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
  }
  return counts;
}

export async function addComment(postId: string, body: string): Promise<Comment> {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Comment cannot be empty');
  if (trimmed.length > 500) throw new Error('Comment cannot exceed 500 characters');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: user.id, body: trimmed })
    .select('*, user:users(username, avatar_url)')
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
