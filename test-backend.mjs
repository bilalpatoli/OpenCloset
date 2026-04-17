// Backend integration test — no frontend required.
// Tests Supabase auth, database, RLS, and Claude Vision end-to-end.
// Run with: node test-backend.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env manually (no extra deps needed)
const envFile = readFileSync('.env', 'utf8');
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
}

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const testEmail = 'test@opencloset.dev';
const testPassword = 'TestPassword123!';
const testUsername = 'testuser';

let userId, closetItemId, outfitPostId;

// ─── Helpers ───────────────────────────────────────────────────────────────

async function run(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    await fn();
    console.log('✓');
  } catch (err) {
    console.log(`✗\n    ${err.message}`);
    process.exit(1);
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────

console.log('\n── Auth ──');

await run('login returns a session', async () => {
  const { data, error } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPassword });
  if (error) throw error;
  if (!data.session) throw new Error('No session returned');
  userId = data.user.id;
  await supabase.auth.setSession(data.session);
});

await run('upsert public user profile', async () => {
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, username: testUsername }, { onConflict: 'id' });
  if (error) throw error;
});

await run('fetch user profile returns correct username', async () => {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  if (data.username !== testUsername) throw new Error(`Expected ${testUsername}, got ${data.username}`);
});

// ─── Closet ────────────────────────────────────────────────────────────────

console.log('\n── Closet ──');

await run('save closet item', async () => {
  const { data, error } = await supabase
    .from('closet_items')
    .insert({ user_id: userId, name: 'White T-Shirt', category: 'top', color: 'White' })
    .select()
    .single();
  if (error) throw error;
  closetItemId = data.id;
});

await run('fetch closet returns items', async () => {
  const { data, error } = await supabase
    .from('closet_items')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  if (!data.length) throw new Error('No closet items found');
});


// ─── Outfit Posts ──────────────────────────────────────────────────────────

console.log('\n── Outfit Posts ──');

await run('create outfit post', async () => {
  const { data, error } = await supabase
    .from('outfit_posts')
    .insert({ user_id: userId, image_url: 'https://example.com/outfit.jpg', caption: 'Test outfit' })
    .select()
    .single();
  if (error) throw error;
  outfitPostId = data.id;
});

await run('link closet item to outfit via outfit_items', async () => {
  const { error } = await supabase
    .from('outfit_items')
    .insert({ outfit_post_id: outfitPostId, closet_item_id: closetItemId });
  if (error) throw error;
});

await run('fetch feed returns joined user + items', async () => {
  const { data, error } = await supabase
    .from('outfit_posts')
    .select('*, user:users(username, avatar_url), outfit_items(closet_item:closet_items(*))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data.length) throw new Error('Feed is empty');
  const post = data[0];
  if (!post.user?.username) throw new Error('User not joined onto post');
  if (!post.outfit_items?.length) throw new Error('outfit_items not joined');
});

await run('fetch outfits by user returns correct post', async () => {
  const { data, error } = await supabase
    .from('outfit_posts')
    .select('*, user:users(username, avatar_url), outfit_items(closet_item:closet_items(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data.find(p => p.id === outfitPostId)) throw new Error('Post not found');
});

// ─── AI (Claude Vision) ────────────────────────────────────────────────────

console.log('\n── AI (Claude Vision) ──');

await run('Edge Function: analyze-outfit returns structured items', async () => {
  const imageRes = await fetch('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80');
  if (!imageRes.ok) throw new Error(`Failed to fetch test image: ${imageRes.status}`);
  const buffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  // Call via the Edge Function — same path the app uses
  const { data, error } = await supabase.functions.invoke('analyze-outfit', {
    body: { base64Image: base64, mediaType: 'image/jpeg' },
  });

  if (error) throw new Error(`Edge Function error: ${error.message}`);
  if (!Array.isArray(data?.items)) throw new Error('items is not an array');
  if (!data.items.length) throw new Error('No items detected');

  console.log(`\n    Detected ${data.items.length} item(s):`);
  for (const item of data.items) {
    console.log(`      • ${item.name} (${item.category}, ${item.color})`);
  }
  process.stdout.write('  ');
});

// ─── Cleanup ───────────────────────────────────────────────────────────────

console.log('\n── Cleanup ──');

await run('delete outfit_items', async () => {
  const { error } = await supabase.from('outfit_items').delete().eq('outfit_post_id', outfitPostId);
  if (error) throw error;
});

await run('delete outfit_post', async () => {
  const { error } = await supabase.from('outfit_posts').delete().eq('id', outfitPostId);
  if (error) throw error;
});

await run('delete closet_item', async () => {
  const { error } = await supabase.from('closet_items').delete().eq('id', closetItemId);
  if (error) throw error;
});

console.log('\n✅ All tests passed\n');
