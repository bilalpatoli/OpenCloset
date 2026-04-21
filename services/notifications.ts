import { supabase } from './supabase';

export async function registerPushToken(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      { user_id: userId, token, platform },
      { onConflict: 'user_id,token', ignoreDuplicates: true }
    );

  if (error) throw error;
}

export async function unregisterPushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);

  if (error) throw error;
}

export async function getUserPushTokens(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((row) => row.token);
}
