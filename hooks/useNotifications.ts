import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchActivity, type ActivityItem } from '../services/activityFeed';

export function useNotifications(userId: string | null) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchActivity(userId);
      setItems(data);
      setUnreadCount(data.filter((n) => n.created_at > lastSeenRef.current).length);
    } catch {
      // silently fail — non-critical
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  function markSeen() {
    lastSeenRef.current = new Date().toISOString();
    setUnreadCount(0);
  }

  return { items, loading, unreadCount, markSeen, refresh: load };
}
