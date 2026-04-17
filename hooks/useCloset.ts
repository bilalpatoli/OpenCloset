import { useEffect, useState } from 'react';
import { fetchCloset } from '../services/closet';
import type { ClosetItem } from '../types/closet';

export function useCloset(userId: string) {
  const [items, setItems] = useState<ClosetItem[]>([]);

  useEffect(() => {
    if (userId) fetchCloset(userId).then(({ data }) => setItems(data ?? []));
  }, [userId]);

  return { items };
}
