import { supabase } from './supabase';
import type { OutfitPost, OutfitPostWithItems } from '../types/outfit';
import type { ClosetItem } from '../types/closet';

export async function createOutfitPost(
  post: Omit<OutfitPost, 'id' | 'created_at'>,
  closetItemIds: string[]
): Promise<OutfitPost> {
  if (!post.user_id) throw new Error('user_id is required');
  if (!post.image_url) throw new Error('image_url is required');
  if (post.caption && post.caption.length > 500) throw new Error('Caption cannot exceed 500 characters');
  if (new Set(closetItemIds).size !== closetItemIds.length) throw new Error('Duplicate closet item IDs');

  const { data, error } = await supabase
    .from('outfit_posts')
    .insert(post)
    .select()
    .single();

  if (error) throw error;

  if (closetItemIds.length > 0) {
    const outfitItems = closetItemIds.map((closet_item_id) => ({
      outfit_post_id: data.id,
      closet_item_id,
    }));

    const { error: itemsError } = await supabase
      .from('outfit_items')
      .insert(outfitItems);

    if (itemsError) throw itemsError;
  }

  return data;
}

function flattenPost(post: any): OutfitPostWithItems {
  return {
    id: post.id,
    user_id: post.user_id,
    image_url: post.image_url,
    caption: post.caption,
    created_at: post.created_at,
    user: post.user,
    items: (post.outfit_items ?? [])
      .map((oi: any) => oi.closet_item as ClosetItem)
      .filter(Boolean),
  };
}

export async function fetchFeed(
  options?: { limit?: number; offset?: number }
): Promise<{ posts: OutfitPostWithItems[]; hasMore: boolean }> {
  const limit = Math.min(options?.limit ?? 20, 50);
  const offset = options?.offset ?? 0;

  const { data, error } = await supabase
    .from('outfit_posts')
    .select(`
      *,
      user:users(username, avatar_url),
      outfit_items(closet_item:closet_items(*))
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const posts = (data ?? []).map(flattenPost);
  return { posts, hasMore: posts.length === limit };
}

export async function deleteOutfitPost(postId: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_outfit_post', { post_id: postId });
  if (error) throw error;
}

export async function fetchOutfitsByUser(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ posts: OutfitPostWithItems[]; hasMore: boolean }> {
  const limit = Math.min(options?.limit ?? 20, 50);
  const offset = options?.offset ?? 0;

  const { data, error } = await supabase
    .from('outfit_posts')
    .select(`
      *,
      user:users(username, avatar_url),
      outfit_items(closet_item:closet_items(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  const posts = (data ?? []).map(flattenPost);
  return { posts, hasMore: posts.length === limit };
}
