import { supabase } from './supabase';

export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function getFollowers(userId: string): Promise<import('../types/user').UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('users!follower_id(id, username, avatar_url, bio, location, created_at)')
    .eq('following_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.users).filter(Boolean);
}

export async function getFollowing(userId: string): Promise<import('../types/user').UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('users!following_id(id, username, avatar_url, bio, location, created_at)')
    .eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.users).filter(Boolean);
}

export async function getFollowCounts(
  userId: string
): Promise<{ followers: number; following: number }> {
  const [followersRes, followingRes] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);
  if (followersRes.error) throw followersRes.error;
  if (followingRes.error) throw followingRes.error;
  return {
    followers: followersRes.count ?? 0,
    following: followingRes.count ?? 0,
  };
}
