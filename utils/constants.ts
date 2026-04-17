export const CLOTHING_CATEGORIES = [
  'top',
  'bottom',
  'outerwear',
  'footwear',
  'accessory',
  'dress',
  'other',
] as const;

export type ClothingCategory = typeof CLOTHING_CATEGORIES[number];
