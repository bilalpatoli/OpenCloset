import { useEffect, useState } from 'react';
import { fetchFeed, deleteOutfitPost } from '../services/outfits';
import type { OutfitPostWithItems } from '../types/outfit';

export function useFeed() {
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);

  useEffect(() => {
    fetchFeed().then(setOutfits).catch(console.error);
  }, []);

  async function deleteOutfit(postId: string): Promise<void> {
    setOutfits((prev) => prev.filter((o) => o.id !== postId));
    try {
      await deleteOutfitPost(postId);
    } catch (err) {
      fetchFeed().then(setOutfits).catch(console.error);
      throw err;
    }
  }

  return { outfits, deleteOutfit };
}
