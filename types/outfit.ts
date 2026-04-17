import type { ClosetItem } from './closet';
import type { UserProfile } from './user';

export interface OutfitPost {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

export interface OutfitItem {
  id: string;
  outfit_post_id: string;
  closet_item_id: string;
}

// Joined shape used in the feed (outfit + author + closet items)
export interface OutfitPostWithItems extends OutfitPost {
  user: Pick<UserProfile, 'username' | 'avatar_url'>;
  items: ClosetItem[];
}
