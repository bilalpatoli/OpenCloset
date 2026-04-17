import { supabase } from './supabase';

export async function login(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signup(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function logout() {
  return supabase.auth.signOut();
}
