import { supabase } from './supabase';

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const { data: post } = await supabase
    .from('outfit_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    const { error } = await supabase.from('post_likes').delete().eq('id', existing.id);
    if (error) throw error;
    liked = false;
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw error;
    liked = true;
  }

  if (liked && post && post.user_id !== userId) {
    supabase.functions.invoke('send-notification', {
      body: { userId: post.user_id, title: 'New like', body: 'Someone liked your outfit' },
    });
  }

  return liked;
}

export async function addComment(postId: string, userId: string, body: string): Promise<void> {
  const { data: post } = await supabase
    .from('outfit_posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  const { error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, body });

  if (error) throw error;

  if (post && post.user_id !== userId) {
    const truncated = body.length > 50 ? body.slice(0, 50) + '\u2026' : body;
    supabase.functions.invoke('send-notification', {
      body: { userId: post.user_id, title: 'New comment', body: truncated },
    });
  }
}
