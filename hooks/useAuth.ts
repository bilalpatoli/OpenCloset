import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  // True until the initial session check completes — prevents premature redirects
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { userId, loading };
}
