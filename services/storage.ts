import { supabase } from './supabase';
import { uploadStore } from './uploadStore';

const BUCKET = 'outfit-images';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64(base64: string): Uint8Array {
  const lookup = new Uint8Array(256);
  for (let i = 0; i < BASE64_CHARS.length; i++) {
    lookup[BASE64_CHARS.charCodeAt(i)] = i;
  }
  const len = base64.length;
  let bufLen = Math.floor(len * 0.75);
  if (base64[len - 1] === '=') bufLen--;
  if (base64[len - 2] === '=') bufLen--;
  const bytes = new Uint8Array(bufLen);
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[base64.charCodeAt(i)];
    const b = lookup[base64.charCodeAt(i + 1)];
    const c = lookup[base64.charCodeAt(i + 2)];
    const d = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (a << 2) | (b >> 4);
    if (p < bufLen) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < bufLen) bytes[p++] = ((c & 3) << 6) | (d & 63);
  }
  return bytes;
}

export async function uploadOutfitImage(localUri: string, userId: string): Promise<string> {
  const ext = localUri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const pending = uploadStore.get();
  if (!pending) throw new Error('No image data available — please retake the photo.');
  uploadStore.clear();

  const bytes = decodeBase64(pending.base64);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated.');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${fileName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': contentType,
      'apikey': anonKey!,
    },
    body: bytes.buffer as ArrayBuffer,
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Upload failed (${res.status}): ${msg}`);
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`;

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${fileName}`;
}
