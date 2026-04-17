import { supabase } from './supabase';

export async function signup(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Signup failed: no user returned');

  // Create the public profile row linked to the auth user
  const { error: profileError } = await supabase
    .from('users')
    .insert({ id: data.user.id, username });

  if (profileError) throw profileError;

  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
