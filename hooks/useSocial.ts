import { useState, useEffect, useCallback } from 'react';
import {
  toggleLike,
  fetchLikes,
  addComment,
  fetchComments,
  deleteComment,
} from '../services/social';
import type { CommentWithUser } from '../types/outfit';

export function useSocial(postId: string, currentUserId: string | null) {
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const [likesData, commentsData] = await Promise.all([
        fetchLikes(postId, currentUserId ?? undefined),
        fetchComments(postId),
      ]);
      if (cancelled) return;
      setLikeCount(likesData.count);
      setIsLiked(likesData.likedByCurrentUser);
      setComments(commentsData);
      setLoading(false);
    }

    load().catch(console.error);
    return () => { cancelled = true; };
  }, [postId, currentUserId]);

  // Optimistic like toggle — updates state immediately, reverts on error
  const handleToggleLike = useCallback(async () => {
    if (!currentUserId) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      const result = await toggleLike(postId, currentUserId);
      setIsLiked(result.liked);
      setLikeCount(result.count);
    } catch {
      // Revert on failure
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }, [postId, currentUserId, isLiked, likeCount]);

  const handleAddComment = useCallback(async (body: string) => {
    if (!currentUserId || !body.trim()) return;
    const comment = await addComment(postId, currentUserId, body.trim());
    setComments(prev => [...prev, comment]);
  }, [postId, currentUserId]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!currentUserId) return;
    await deleteComment(commentId, currentUserId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }, [currentUserId]);

  return {
    likeCount,
    isLiked,
    comments,
    loading,
    handleToggleLike,
    handleAddComment,
    handleDeleteComment,
  };
}
