import { supabase } from './supabase';
import type { ClosetItem } from '../types/closet';

export async function saveClosetItem(item: Omit<ClosetItem, 'id' | 'created_at'>) {
  return supabase.from('closet_items').insert(item);
}

export async function fetchCloset(userId: string) {
  return supabase.from('closet_items').select('*').eq('user_id', userId);
}
