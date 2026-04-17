import type { ClothingCategory } from '../utils/constants';

export interface ClosetItem {
  id: string;
  user_id: string;
  category: ClothingCategory;
  label: string;
  color?: string;
  brand?: string;
  image_url?: string;
  created_at: string;
}
