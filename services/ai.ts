import Anthropic from '@anthropic-ai/sdk';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../utils/constants';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DetectedItem {
  category: ClothingCategory;
  label: string;
  color?: string;
  brand?: string;
}

export interface OutfitAnalysisResult {
  items: DetectedItem[];
  raw: string;
}

const SYSTEM_PROMPT = `You are a fashion analysis assistant. When given a photo of an outfit, identify every visible clothing item and accessory.

Respond with ONLY valid JSON in this exact shape — no markdown, no explanation:
{
  "items": [
    {
      "category": "<one of: top | bottom | outerwear | footwear | accessory | dress | other>",
      "label": "<specific item name, e.g. 'white crew-neck t-shirt'>",
      "color": "<primary color or color description>",
      "brand": "<brand name if visible, otherwise omit>"
    }
  ]
}

Rules:
- Be specific with labels (e.g. "slim-fit dark jeans" not just "pants")
- Only include items that are clearly visible
- Use lowercase for all string values
- If you cannot detect any clothing, return { "items": [] }`;

function parseAnalysisResponse(text: string): DetectedItem[] {
  const json = JSON.parse(text);
  if (!Array.isArray(json.items)) throw new Error('Unexpected response shape');

  return json.items.map((item: Record<string, string>) => ({
    category: CLOTHING_CATEGORIES.includes(item.category as ClothingCategory)
      ? (item.category as ClothingCategory)
      : 'other',
    label: item.label ?? 'unknown item',
    ...(item.color ? { color: item.color } : {}),
    ...(item.brand ? { brand: item.brand } : {}),
  }));
}

export async function analyzeOutfitImage(
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<OutfitAnalysisResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: 'Identify all clothing items in this outfit photo.',
          },
        ],
      },
    ],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const items = parseAnalysisResponse(raw);

  return { items, raw };
}
