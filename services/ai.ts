import Anthropic from '@anthropic-ai/sdk';
import type { ClothingCategory } from '../utils/constants';

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
- accessory: earbuds, headphones, watches, hats, caps, bags, sunglasses, jewellery, belts, scarves
- dress: one-piece dresses, jumpsuits, rompers
- other: only if nothing above fits

Color rules:
- Describe the actual color you can see
- Use modifiers when helpful: 'light blue', 'dark navy', 'heather grey'
- If the brand name is clearly visible, include it in the item name

General rules:
- Only include items clearly visible in the photo
- Use Title Case for item names
- If no clothing is visible, return { "items": [] }`;

export interface DetectedItem {
  name: string;
  category: ClothingCategory;
  color?: string;
}

export interface OutfitAnalysisResult {
  items: DetectedItem[];
}

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY!,
  dangerouslyAllowBrowser: true,
});

export async function analyzeOutfitImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OutfitAnalysisResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
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
          { type: 'text', text: 'Identify all clothing items in this outfit photo.' },
        ],
      },
    ],
  });

  const rawText = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const json = JSON.parse(cleaned) as { items: Record<string, string>[] };

  if (!Array.isArray(json.items)) throw new Error('Unexpected response from AI.');

  const items: DetectedItem[] = json.items.map((item) => ({
    name: item.name ?? 'Unknown Item',
    category: (CLOTHING_CATEGORIES.includes(item.category) ? item.category : 'other') as ClothingCategory,
    ...(item.color ? { color: item.color } : {}),
  }));

  return { items };
}
