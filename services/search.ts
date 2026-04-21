import { supabase } from './supabase';
import type { UserProfile } from '../types/user';

interface SearchResult {
  users: UserProfile[];
  total: number;
  hasMore: boolean;
}

interface SearchOptions {
  limit?: number;
  offset?: number;
}

function normalize(options?: SearchOptions): { limit: number; offset: number } {
  return {
    limit: Math.min(options?.limit ?? 20, 50),
    offset: options?.offset ?? 0,
  };
}

export async function searchUsers(query: string, options?: SearchOptions): Promise<SearchResult> {
  if (!query || query.length < 2) throw new Error('Query must be at least 2 characters');
  const { limit, offset } = normalize(options);

  const { data, error, count } = await supabase
    .from('users')
    .select('id, username, avatar_url, bio, location, created_at', { count: 'exact' })
    .ilike('username', `%${query}%`)
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const users = (data ?? []) as UserProfile[];
  return { users, total: count ?? 0, hasMore: users.length === limit };
}

export async function searchByLocation(
  location: string,
  options?: SearchOptions
): Promise<SearchResult> {
  if (!location || location.length < 2) throw new Error('Location must be at least 2 characters');
  const { limit, offset } = normalize(options);

  const { data, error, count } = await supabase
    .from('users')
    .select('id, username, avatar_url, bio, location, created_at', { count: 'exact' })
    .ilike('location', `%${location}%`)
    .range(offset, offset + limit - 1);

  if (error) throw error;
  const users = (data ?? []) as UserProfile[];
  return { users, total: count ?? 0, hasMore: users.length === limit };
}
