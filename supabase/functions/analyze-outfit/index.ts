// Supabase Edge Function — analyze-outfit
// Receives a base64 outfit image, calls Claude Vision, returns detected clothing items.
// The Anthropic API key never leaves the server.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOTHING_CATEGORIES = ['top', 'bottom', 'outerwear', 'footwear', 'accessory', 'dress', 'other'];

const SYSTEM_PROMPT = `You are a fashion analysis assistant. When given a photo of an outfit, identify every visible clothing item and accessory.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "items": [
    {
      "name": "<descriptive item name, e.g. 'White Crew-Neck T-Shirt'>",
      "category": "<one of: top | bottom | outerwear | footwear | accessory | dress | other>",
      "color": "<primary color>"
    }
  ]
}

Rules:
- Only include items that are clearly visible in the photo
- Use Title Case for item names (e.g. 'Black Slim-Fit Jeans', not 'black jeans')
- Do not infer or guess brand names
- If uncertain about an item, make a conservative best guess
- If no clothing is visible, return { "items": [] }`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { image, mediaType = 'image/jpeg' } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'Missing image in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Anthropic API
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: image },
              },
              {
                type: 'text',
                text: 'Identify all clothing items in this outfit photo.',
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      throw new Error(`Anthropic API error: ${err}`);
    }

    const anthropicData = await anthropicRes.json();
    const rawText = anthropicData.content?.[0]?.text ?? '';
    const parsed = JSON.parse(rawText);

    // Validate and normalize items
    const items = (parsed.items ?? []).map((item: Record<string, string>) => ({
      name: item.name ?? 'Unknown Item',
      category: CLOTHING_CATEGORIES.includes(item.category) ? item.category : 'other',
      ...(item.color ? { color: item.color } : {}),
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
