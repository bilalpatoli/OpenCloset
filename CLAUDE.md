# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenCloset is an AI-powered mobile app built with **Expo and React Native** that captures outfit photos, uses Claude Vision API to identify clothing items, and stores them in a personal digital closet.

**Tech Stack:**
- Expo 52 / React Native 0.76
- Expo Router (file-based navigation)
- Supabase (auth, database, storage)
- Claude Vision API (Anthropic SDK)
- TypeScript

## Development Commands

```bash
npm install                 # Install dependencies
npm start                   # Start dev server (prompts for platform)
npm run android             # Run on Android emulator
npm run ios                 # Run on iOS simulator

# Environment setup
cp .env.example .env        # Create .env with your API keys
```

**Note:** No test runner or linter is configured. Type safety is enforced via TypeScript.

## Architecture

### Folder Structure

```
app/              Expo Router screens (tabs, auth, closet, outfit flows)
components/       Reusable UI (CameraButton, ClosetGrid, OutfitCard, etc.)
services/         API layer (Supabase, Claude Vision)
hooks/            Custom React hooks (useAuth, useCloset, useFeed)
utils/            Constants (CLOTHING_CATEGORIES enum)
types/            TypeScript interfaces
```

### Data Flow

1. **Services** (`services/*.ts`): Stateless API adapters for Supabase and Claude SDK
2. **Hooks** (`hooks/*.ts`): Manage component state and call services to sync with backend
3. **Components**: Consume hooks, render UI; do not call services directly

### Claude Vision Integration

`services/ai.ts` exports `analyzeOutfitImage(base64Image, mediaType)`:
- Takes a base64-encoded image (JPEG, PNG, WebP)
- Calls `claude-opus-4-7` with structured system prompt
- Returns `{ items: DetectedItem[], raw: string }` where items have category (from `CLOTHING_CATEGORIES`), label, color, brand
- Validates response JSON; unmapped categories fall back to 'other'

The system prompt in `services/ai.ts:20–38` defines the JSON schema Claude returns. Update it if you need to change what clothing attributes are extracted.

### Supabase Integration

`services/supabase.ts` is a singleton client used by `auth.ts`, `closet.ts`, and `outfits.ts`. Row-level security isolates user data.

**Database Schema:**

| Table | Fields |
|-------|--------|
| `users` | id, username, avatar_url |
| `outfit_posts` | id, user_id, image_url, caption, created_at |
| `closet_items` | id, user_id, name, category, color, image_url, created_at |
| `outfit_items` | id, outfit_post_id, closet_item_id |

### Routing

Expo Router generates routes from file structure. Post-login flow: camera → `/outfit/review` → Claude analysis → `/outfit/success` → closet saved. Auth screens show first if unauthenticated.

### User Flow

1. User signs up or logs in
2. User opens Camera tab
3. User takes or uploads a photo of their outfit
4. Image is sent to Claude for outfit analysis
5. Claude returns a structured list of clothing items
6. User reviews and edits the detected items
7. User saves items to their closet
8. User can optionally post the full outfit to the public feed
9. Other users can view profiles and closets

## Key Implementation Notes

**Clothing Categories:** `CLOTHING_CATEGORIES` in `utils/constants.ts` is the source of truth. Keep the type `ClothingCategory` and array in sync when adding categories.

**Image Format for Claude:** Requires base64 encoding with explicit media type (JPEG/PNG/WebP) for the Anthropic SDK.

**Adding a Feature:**
1. Create service in `services/` (stateless API logic)
2. Create hook in `hooks/` (state management, calls service)
3. Consume hook in component

**MVP Scope:** Do not build features outside the MVP unless clearly useful. Do not add unnecessary libraries.

**Claude AI Behavior:** Only identify visible clothing and accessories. Make a best guess when uncertain but stay conservative. Do not infer brand unless clearly visible on the item. Do not invent hidden clothing items. Always let the user edit detected items before saving.
