import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOTHING_CATEGORIES = ['top', 'bottom', 'outerwear', 'footwear', 'accessory', 'dress', 'other'];

const SYSTEM_PROMPT = `You are a fashion analysis assistant. When given a photo of an outfit, identify every visible clothing item and accessory worn by the person.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "items": [
    {
      "name": "<descriptive item name, e.g. 'Blue Crew-Neck T-Shirt'>",
      "category": "<one of: top | bottom | outerwear | footwear | accessory | dress | other>",
      "color": "<primary color as a simple English word, e.g. 'blue', 'dark grey', 'olive green'>"
    }
  ]
}

Category rules (follow strictly):
- top: shirts, t-shirts, blouses, sweaters, hoodies, polos, tank tops
- bottom: pants, jeans, shorts, skirts, trousers
- outerwear: jackets, coats, blazers, vests worn over clothing
- footwear: shoes, sneakers, boots, sandals
- accessory: earbuds, headphones, watches, hats, caps, bags, sunglasses, jewellery, belts, scarves — any non-clothing item worn on the body
- dress: one-piece dresses, jumpsuits, rompers
- other: only if nothing above fits

Color rules:
- Describe the actual color you can see — do not default to grey if the item looks like it could be another color
- Use modifiers when helpful: 'light blue', 'dark navy', 'heather grey'
- If the brand name is clearly visible on the item, you may include it in the item name (e.g. 'Lululemon Crew-Neck Top')

General rules:
- Only include items clearly visible in the photo — partial body shots are common, only identify what you can see
- Use Title Case for item names
- Earbuds, AirPods, or headphones are always category "accessory", never "top"
- If no clothing is visible, return { "items": [] }`;

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

  // Verify the caller is an authenticated user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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

  let base64Image: string;
  let mediaType: string;
  try {
    const body = await req.json();
    base64Image = body.base64Image;
    mediaType = body.mediaType ?? 'image/jpeg';
    if (!base64Image) throw new Error('missing base64Image');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

  let rawText: string;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: base64Image },
            },
            { type: 'text', text: 'Identify all clothing items in this outfit photo.' },
          ],
        },
      ],
    });
    rawText = response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Analysis failed — please try again.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let items: unknown[];
  try {
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const json = JSON.parse(cleaned) as { items: Record<string, string>[] };
    if (!Array.isArray(json.items)) throw new Error('unexpected shape');
    items = json.items.map((item) => ({
      name: item.name ?? 'Unknown Item',
      category: CLOTHING_CATEGORIES.includes(item.category) ? item.category : 'other',
      ...(item.color ? { color: item.color } : {}),
    }));
  } catch {
    return new Response(
      JSON.stringify({ error: 'AI returned an unreadable response — please try again.' }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify({ items }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
