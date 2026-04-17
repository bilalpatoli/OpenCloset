import { supabase } from './supabase';

const BUCKET = 'outfit-images';

// Uploads a local image URI to Supabase Storage and returns the public URL.
// The URI comes from expo-image-picker or expo-camera (e.g. file:///...).
export async function uploadOutfitImage(localUri: string, userId: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, blob, { contentType, upsert: false });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(data.path);

  return publicUrl;
}
