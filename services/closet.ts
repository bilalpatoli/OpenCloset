import { supabase } from './supabase';
import type { ClosetItem } from '../types/closet';

export async function saveClosetItem(
  item: Omit<ClosetItem, 'id' | 'created_at'>
): Promise<ClosetItem> {
  const { data, error } = await supabase
    .from('closet_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCloset(userId: string): Promise<ClosetItem[]> {
  const { data, error } = await supabase
    .from('closet_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteClosetItem(itemId: string): Promise<void> {
  const { error: outfitItemsError } = await supabase
    .from('outfit_items')
    .delete()
    .eq('closet_item_id', itemId);

  if (outfitItemsError) throw outfitItemsError;

  const { error } = await supabase
    .from('closet_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
