import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '../types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user as User));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((session?.user as User) ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { user };
}
