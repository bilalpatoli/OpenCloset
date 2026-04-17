import { supabase } from './supabase';
import type { Outfit } from '../types/outfit';

export async function createOutfit(outfit: Omit<Outfit, 'id' | 'created_at'>) {
  return supabase.from('outfits').insert(outfit);
}

export async function fetchFeed() {
  return supabase.from('outfits').select('*').order('created_at', { ascending: false });
}
