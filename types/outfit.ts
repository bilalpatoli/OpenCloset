import type { ClosetItem } from './closet';

export interface Outfit {
  id: string;
  user_id: string;
  image_url: string;
  items: ClosetItem[];
  caption?: string;
  is_public: boolean;
  created_at: string;
}
