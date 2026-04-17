import { useEffect, useState } from 'react';
import { fetchCloset } from '../services/closet';
import type { ClosetItem } from '../types/closet';

export function useCloset(userId: string | null) {
  const [items, setItems] = useState<ClosetItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchCloset(userId).then(setItems).catch(console.error);
  }, [userId]);

  return { items };
}
