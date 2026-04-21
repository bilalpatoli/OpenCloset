import { useCallback, useEffect, useState } from 'react';
import { fetchCloset } from '../services/closet';
import type { ClosetItem } from '../types/closet';

const PAGE_SIZE = 50;

export function useCloset(userId: string | null) {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const refetch = useCallback(() => {
    if (!userId) return;
    fetchCloset(userId, { limit: PAGE_SIZE, offset: 0 })
      .then(({ items: fetched, hasMore: more }) => {
        setItems(fetched);
        setHasMore(more);
        setOffset(fetched.length);
      })
      .catch(console.error);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (!userId || !hasMore) return;
    fetchCloset(userId, { limit: PAGE_SIZE, offset })
      .then(({ items: fetched, hasMore: more }) => {
        setItems((prev) => [...prev, ...fetched]);
        setHasMore(more);
        setOffset((prev) => prev + fetched.length);
      })
      .catch(console.error);
  }, [userId, hasMore, offset]);

  return { items, hasMore, loadMore, refetch };
}
