import type { ClothingCategory } from '../utils/constants';

export interface ClosetItem {
  id: string;
  user_id: string;
  name: string;
  category: ClothingCategory;
  color?: string;
  image_url?: string;
  created_at: string;
}
