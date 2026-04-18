import { supabase } from './supabase';
import type { ClothingCategory } from '../utils/constants';

export interface DetectedItem {
  name: string;
  category: ClothingCategory;
  color?: string;
}

export interface OutfitAnalysisResult {
  items: DetectedItem[];
}

// Sends the image to the Supabase Edge Function, which calls Claude server-side.
// The Anthropic API key is never exposed to the client.
export async function analyzeOutfitImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OutfitAnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-outfit', {
    body: { image: base64Image, mediaType },
  });

  if (error) throw error;
  if (!data?.items) throw new Error('Unexpected response from analyze-outfit function');

  return { items: data.items as DetectedItem[] };
}
