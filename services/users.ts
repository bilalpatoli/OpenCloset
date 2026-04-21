import { supabase } from './supabase';
import type { UserProfile } from '../types/user';

const UUID_REGEX = /^[0-9a-f-]{36}$/;

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!UUID_REGEX.test(userId)) throw new Error('Invalid userId');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'username' | 'avatar_url' | 'bio' | 'location'>>
): Promise<UserProfile> {
  if (updates.username !== undefined) {
    if (!updates.username) throw new Error('Username cannot be empty');
    if (updates.username.length > 30) throw new Error('Username cannot exceed 30 characters');
  }
  if (updates.bio !== undefined && updates.bio.length > 300) {
    throw new Error('Bio cannot exceed 300 characters');
  }
  if (updates.location !== undefined && updates.location.length > 100) {
    throw new Error('Location cannot exceed 100 characters');
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, blob, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
