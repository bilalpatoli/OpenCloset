import Anthropic from '@anthropic-ai/sdk';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../utils/constants';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
});

const ANALYSIS_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Analysis timed out — please try again.')), ms)
    ),
  ]);
}

export interface DetectedItem {
  name: string;
  category: ClothingCategory;
  color?: string;
}

export interface OutfitAnalysisResult {
  items: DetectedItem[];
}

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

function parseResponse(text: string): DetectedItem[] {
  let json: unknown;
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    json = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned an unreadable response — please try again.');
  }

  if (!json || typeof json !== 'object' || !Array.isArray((json as Record<string, unknown>).items)) {
    throw new Error('AI response was missing expected data — please try again.');
  }

  return ((json as Record<string, unknown>).items as Record<string, string>[]).map((item) => ({
    name: item.name ?? 'Unknown Item',
    category: CLOTHING_CATEGORIES.includes(item.category as ClothingCategory)
      ? (item.category as ClothingCategory)
      : 'other',
    ...(item.color ? { color: item.color } : {}),
  }));
}

export async function analyzeOutfitImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OutfitAnalysisResult> {
  const response = await withTimeout(client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text: 'Identify all clothing items in this outfit photo.',
          },
        ],
      },
    ],
  }), ANALYSIS_TIMEOUT_MS);

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  return { items: parseResponse(raw) };
}
