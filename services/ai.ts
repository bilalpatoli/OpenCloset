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

export async function analyzeOutfitImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OutfitAnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-outfit', {
    body: { base64Image, mediaType },
  });

  if (error) {
    let detail = error.message;
    try {
      const body = await (error as any).context?.json?.();
      if (body?.error) detail = body.error;
    } catch {}
    throw new Error(detail || 'Analysis failed — please try again.');
  }

  return data as OutfitAnalysisResult;
}
