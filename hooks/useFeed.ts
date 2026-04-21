import { useCallback, useEffect, useState } from 'react';
import { fetchFeed, fetchFollowingFeed, deleteOutfitPost } from '../services/outfits';
import type { OutfitPostWithItems } from '../types/outfit';

const PAGE_SIZE = 20;

function fetchForMode(mode: 'forYou' | 'following', userId?: string) {
  return (opts?: { limit?: number; offset?: number }) =>
    mode === 'following' && userId
      ? fetchFollowingFeed(userId, opts)
      : fetchFeed(opts);
}

export function useFeed(mode: 'forYou' | 'following' = 'forYou', userId?: string) {
  const [outfits, setOutfits] = useState<OutfitPostWithItems[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetch = fetchForMode(mode, userId);
    setOutfits([]);
    setOffset(0);
    setHasMore(false);
    fetch({ limit: PAGE_SIZE, offset: 0 })
      .then(({ posts, hasMore: more }) => {
        setOutfits(posts);
        setHasMore(more);
        setOffset(posts.length);
      })
      .catch(console.error);
  }, [mode, userId]);

  const loadMore = useCallback(() => {
    if (!hasMore) return;
    const fetch = fetchForMode(mode, userId);
    fetch({ limit: PAGE_SIZE, offset })
      .then(({ posts, hasMore: more }) => {
        setOutfits((prev) => [...prev, ...posts]);
        setHasMore(more);
        setOffset((prev) => prev + posts.length);
      })
      .catch(console.error);
  }, [hasMore, offset, mode, userId]);

  const refetch = useCallback(() => {
    const fetch = fetchForMode(mode, userId);
    fetch({ limit: PAGE_SIZE, offset: 0 })
      .then(({ posts, hasMore: more }) => {
        setOutfits(posts);
        setHasMore(more);
        setOffset(posts.length);
      })
      .catch(console.error);
  }, [mode, userId]);

  async function deleteOutfit(postId: string): Promise<void> {
    setOutfits((prev) => prev.filter((o) => o.id !== postId));
    try {
      await deleteOutfitPost(postId);
    } catch (err) {
      refetch();
      throw err;
    }
  }

  return { outfits, deleteOutfit, hasMore, loadMore, refetch };
}
