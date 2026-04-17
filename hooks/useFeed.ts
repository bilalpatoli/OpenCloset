import { useEffect, useState } from 'react';
import { fetchFeed } from '../services/outfits';
import type { OutfitPostWithItems } from '../types/outfit';

export function useFeed() {
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);

  useEffect(() => {
    fetchFeed().then(setOutfits).catch(console.error);
  }, []);

  return { outfits };
}
