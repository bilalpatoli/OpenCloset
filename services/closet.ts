import { supabase } from './supabase';
import type { ClosetItem } from '../types/closet';
import { CLOTHING_CATEGORIES } from '../utils/constants';

export async function saveClosetItem(
  item: Omit<ClosetItem, 'id' | 'created_at'>
): Promise<ClosetItem> {
  if (!item.name || item.name.length > 100) {
    throw new Error('Name must be between 1 and 100 characters');
  }
  if (!(CLOTHING_CATEGORIES as readonly string[]).includes(item.category)) {
    throw new Error(`Invalid category: ${item.category}`);
  }
  if (item.color && item.color.length > 50) {
    throw new Error('Color cannot exceed 50 characters');
  }

  const { data, error } = await supabase
    .from('closet_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchCloset(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ items: ClosetItem[]; hasMore: boolean }> {
  const limit = Math.min(options?.limit ?? 50, 100);
  const offset = options?.offset ?? 0;

  const { data, error } = await supabase
    .from('closet_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const items = data ?? [];
  return { items, hasMore: items.length === limit };
}

export async function deleteClosetItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('closet_items')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', itemId);

  if (error) throw error;
}
