import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limit: max 1 request per second per userId
const lastSent = new Map<string, number>();

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { userId: string; title: string; body: string; data?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { userId, title, body: msgBody, data } = body;
  if (!userId || !title || !msgBody) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const now = Date.now();
  const last = lastSent.get(userId) ?? 0;
  if (now - last < 1000) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  lastSent.set(userId, now);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: tokenRows, error: tokenError } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (tokenError) {
    return new Response(JSON.stringify({ error: tokenError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const tokens = (tokenRows ?? []).map((row: { token: string }) => row.token);

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, failed: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const messages = tokens.map((to) => ({
    to,
    title,
    body: msgBody,
    data: data ?? {},
    sound: 'default',
  }));

  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });

  if (!expoRes.ok) {
    return new Response(
      JSON.stringify({ error: 'Expo Push API error', sent: 0, failed: tokens.length }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const expoData: { data: { status: string }[] } = await expoRes.json();
  const results = expoData.data ?? [];
  const sent = results.filter((r) => r.status === 'ok').length;
  const failed = results.length - sent;

  return new Response(JSON.stringify({ sent, failed }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
