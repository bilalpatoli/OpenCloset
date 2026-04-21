import { useCallback, useEffect, useState } from 'react';
import { fetchFeed, deleteOutfitPost } from '../services/outfits';
import type { OutfitPostWithItems } from '../types/outfit';

const PAGE_SIZE = 20;

export function useFeed() {
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchFeed({ limit: PAGE_SIZE, offset: 0 })
      .then(({ posts, hasMore: more }) => {
        setOutfits(posts);
        setHasMore(more);
        setOffset(posts.length);
      })
      .catch(console.error);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    fetchFeed({ limit: PAGE_SIZE, offset })
      .then(({ posts, hasMore: more }) => {
        setOutfits((prev) => [...prev, ...posts]);
        setHasMore(more);
        setOffset((prev) => prev + posts.length);
      })
      .catch(console.error);
  }, [hasMore, offset]);

  async function deleteOutfit(postId: string): Promise<void> {
    setOutfits((prev) => prev.filter((o) => o.id !== postId));
    try {
      await deleteOutfitPost(postId);
    } catch (err) {
      fetchFeed({ limit: PAGE_SIZE, offset: 0 })
        .then(({ posts, hasMore: more }) => {
          setOutfits(posts);
          setHasMore(more);
          setOffset(posts.length);
        })
        .catch(console.error);
      throw err;
    }
  }

  return { outfits, deleteOutfit, hasMore, loadMore };
}
