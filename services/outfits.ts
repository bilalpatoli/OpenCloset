import { supabase } from './supabase';
import type { OutfitPost, OutfitPostWithItems } from '../types/outfit';
import type { ClosetItem } from '../types/closet';

export async function createOutfitPost(
  post: Omit<OutfitPost, 'id' | 'created_at'>,
  closetItemIds: string[]
): Promise<OutfitPost> {
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

export async function fetchFeed(): Promise<OutfitPostWithItems[]> {
  const { data, error } = await supabase
    .from('outfit_posts')
    .select(`
      *,
      user:users(username, avatar_url),
      outfit_items(closet_item:closet_items(*))
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Flatten the nested outfit_items → closet_item shape
  return (data ?? []).map((post: any) => ({
    id: post.id,
    user_id: post.user_id,
    image_url: post.image_url,
    caption: post.caption,
    created_at: post.created_at,
    user: post.user,
    items: (post.outfit_items ?? [])
      .map((oi: any) => oi.closet_item as ClosetItem)
      .filter(Boolean),
  }));
}

export async function deleteOutfitPost(postId: string): Promise<void> {
  const { error: itemsError } = await supabase
    .from('outfit_items')
    .delete()
    .eq('outfit_post_id', postId);

  if (itemsError) throw itemsError;

  const { error } = await supabase
    .from('outfit_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

export async function fetchOutfitsByUser(userId: string): Promise<OutfitPostWithItems[]> {
  const { data, error } = await supabase
    .from('outfit_posts')
    .select(`
      *,
      user:users(username, avatar_url),
      outfit_items(closet_item:closet_items(*))
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((post: any) => ({
    id: post.id,
    user_id: post.user_id,
    image_url: post.image_url,
    caption: post.caption,
    created_at: post.created_at,
    user: post.user,
    items: (post.outfit_items ?? [])
      .map((oi: any) => oi.closet_item as ClosetItem)
      .filter(Boolean),
  }));
}
