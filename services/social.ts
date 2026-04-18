import { supabase } from './supabase';
import type { CommentWithUser } from '../types/outfit';

// ── Likes ──────────────────────────────────────────────────────────────────

export async function toggleLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; count: number }> {
  // Check current like state
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Already liked — remove it
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    // Not yet liked — add it
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
  }

  // Return fresh count
  const { count, error: countError } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (countError) throw countError;

  return { liked: !existing, count: count ?? 0 };
}

export async function fetchLikes(
  postId: string,
  currentUserId?: string
): Promise<{ count: number; likedByCurrentUser: boolean }> {
  const { count, error } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (error) throw error;

  let likedByCurrentUser = false;
  if (currentUserId) {
    const { data } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUserId)
      .maybeSingle();
    likedByCurrentUser = !!data;
  }

  return { count: count ?? 0, likedByCurrentUser };
}

// ── Comments ───────────────────────────────────────────────────────────────

export async function addComment(
  postId: string,
  userId: string,
  body: string
): Promise<CommentWithUser> {
  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, body })
    .select('*, user:users(username, avatar_url)')
    .single();
  if (error) throw error;
  return data;
}

export async function fetchComments(postId: string): Promise<CommentWithUser[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, user:users(username, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  if (error) throw error;
}
