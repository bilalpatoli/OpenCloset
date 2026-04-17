import { useEffect, useState } from 'react';
import { fetchFeed } from '../services/outfits';
import type { Outfit } from '../types/outfit';

export function useFeed() {
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  useEffect(() => {
    fetchFeed().then(({ data }) => setOutfits(data ?? []));
  }, []);

  return { outfits };
}
