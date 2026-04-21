import { useCallback, useEffect, useState } from 'react';
import { followUser, unfollowUser, isFollowing, getFollowCounts } from '../services/follows';

export function useFollow(targetUserId: string | undefined, currentUserId: string | undefined) {
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;
    const jobs: Promise<any>[] = [getFollowCounts(targetUserId)];
    if (currentUserId && currentUserId !== targetUserId) {
      jobs.push(isFollowing(currentUserId, targetUserId));
    }
    Promise.all(jobs)
      .then(([c, followState]) => {
        setCounts(c);
        if (followState !== undefined) setFollowing(followState as boolean);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [targetUserId, currentUserId]);

  const toggle = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? -1 : 1) }));
    try {
      if (wasFollowing) {
        await unfollowUser(currentUserId, targetUserId);
      } else {
        await followUser(currentUserId, targetUserId);
      }
    } catch (err) {
      setFollowing(wasFollowing);
      setCounts((c) => ({ ...c, followers: c.followers + (wasFollowing ? 1 : -1) }));
      throw err;
    }
  }, [following, currentUserId, targetUserId]);

  return { following, counts, loading, toggle };
}
