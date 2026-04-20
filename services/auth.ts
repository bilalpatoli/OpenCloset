import { supabase } from './supabase';

export async function signup(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;
  if (!data.user) throw new Error('Signup failed: no user returned');
  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function loginWithUsername(username: string, password: string) {
  const { data: email, error } = await supabase.rpc('get_email_by_username', {
    p_username: username.toLowerCase().trim(),
  });

  if (error || !email) {
    throw new Error('No account found with that username.');
  }

  return login(email, password);
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
