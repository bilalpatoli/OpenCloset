import { supabase } from './supabase';

export type ActivityItem =
  | { type: 'follow'; id: string; created_at: string; actor: { id: string; username: string; avatar_url: string | null } }
  | { type: 'like';   id: string; created_at: string; post_id: string; post_image_url?: string; actor: { id: string; username: string; avatar_url: string | null } }
  | { type: 'comment'; id: string; created_at: string; post_id: string; post_image_url?: string; body: string; actor: { id: string; username: string; avatar_url: string | null } };

export async function fetchActivity(userId: string): Promise<ActivityItem[]> {
  const [followsRes, postsRes] = await Promise.all([
    supabase
      .from('follows')
      .select('id, created_at, user:follower_id(id, username, avatar_url)')
      .eq('following_id', userId)
      .neq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('outfit_posts')
      .select('id, image_url')
      .eq('user_id', userId)
      .limit(100),
  ]);

  const follows: ActivityItem[] = (followsRes.data ?? []).map((r: any) => ({
    type: 'follow',
    id: r.id,
    created_at: r.created_at,
    actor: r.user,
  }));

  const postIds = (postsRes.data ?? []).map((p: any) => p.id);
  const postImageMap: Record<string, string | undefined> = {};
  for (const p of postsRes.data ?? []) postImageMap[p.id] = p.image_url;

  if (postIds.length === 0) {
    return follows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const [likesRes, commentsRes] = await Promise.all([
    supabase
      .from('likes')
      .select('id, created_at, post_id, user:user_id(id, username, avatar_url)')
      .in('post_id', postIds)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('comments')
      .select('id, created_at, post_id, body, user:user_id(id, username, avatar_url)')
      .in('post_id', postIds)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const likes: ActivityItem[] = (likesRes.data ?? []).map((r: any) => ({
    type: 'like',
    id: r.id,
    created_at: r.created_at,
    post_id: r.post_id,
    post_image_url: postImageMap[r.post_id],
    actor: r.user,
  }));

  const comments: ActivityItem[] = (commentsRes.data ?? []).map((r: any) => ({
    type: 'comment',
    id: r.id,
    created_at: r.created_at,
    post_id: r.post_id,
    post_image_url: postImageMap[r.post_id],
    body: r.body,
    actor: r.user,
  }));

  return [...follows, ...likes, ...comments].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}
