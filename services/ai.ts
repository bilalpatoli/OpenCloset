import Anthropic from '@anthropic-ai/sdk';
import { CLOTHING_CATEGORIES, type ClothingCategory } from '../utils/constants';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DetectedItem {
  name: string;
  category: ClothingCategory;
  color?: string;
}

export interface OutfitAnalysisResult {
  items: DetectedItem[];
}

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

function parseResponse(text: string): DetectedItem[] {
  const json = JSON.parse(text);
  if (!Array.isArray(json.items)) throw new Error('Unexpected AI response shape');

  return json.items.map((item: Record<string, string>) => ({
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
            source: { type: 'base64', media_type: mediaType, data: base64Image },
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
  return { items: parseResponse(raw) };
}
