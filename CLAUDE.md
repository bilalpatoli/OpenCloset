# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenCloset is an AI-powered social fashion app built with **Expo and React Native**. Users capture outfit photos, Claude Vision identifies clothing items, and items are saved to a personal digital closet. Users can post outfits to a shared feed, follow each other, like and comment on posts, and discover others via search/explore.

**Tech Stack:**
- Expo 54 / React Native 0.76
- Expo Router (file-based navigation)
- Supabase (auth, PostgreSQL, storage, edge functions)
- Claude Vision API (`claude-opus-4-7`, Anthropic SDK)
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
app/                    Expo Router screens
  _layout.tsx           Root stack navigator
  index.tsx             Auth gate / splash (redirects to feed or login)
  (tabs)/               Tab navigation (Feed, Capture, Search, Closet)
    _layout.tsx         Tab bar config
    feed.tsx            Feed with "For You" and "Following" tabs
    camera.tsx          Camera + Claude AI analysis + item review flow
    search.tsx          Username search + explore grid
    closet.tsx          Personal closet (posts + wardrobe tabs, avatar)
  auth/
    login.tsx           Username/password login
    signup.tsx          Account creation
  profile/
    [userId].tsx        Dynamic profile view (follow button, posts, wardrobe)
  closet/
    item.tsx            Individual closet item detail
  outfit/
    review.tsx          Outfit item review (secondary flow)
    success.tsx         Post-save confirmation
  settings.tsx          Profile settings (edit bio, location, username, avatar)

components/             Reusable UI components
  OutfitCard.tsx        Feed post card (image, item tags, like/comment actions)
  CommentsSheet.tsx     Bottom sheet modal for viewing/adding comments
  FollowButton.tsx      Follow/Following toggle
  ClosetGrid.tsx        2-column closet item grid
  UserListItem.tsx      User row for search results
  Header.tsx            Reusable header with back/title/right slot
  CameraButton.tsx      Styled button with icon variants
  ItemTag.tsx           Clothing item label badge

services/               Stateless API adapters (no state, no hooks)
  supabase.ts           Singleton Supabase client
  auth.ts               signup, login, loginWithUsername, logout
  users.ts              fetchUserProfile, updateUserProfile, uploadAvatar
  closet.ts             saveClosetItem, fetchCloset, deleteClosetItem
  outfits.ts            createOutfitPost, fetchFeed, fetchFollowingFeed, fetchOutfitsByUser, deleteOutfitPost
  likes.ts              fetchLikeCounts, fetchUserLikes, likePost, unlikePost
  comments.ts           fetchComments, addComment, deleteComment, fetchCommentCounts
  follows.ts            followUser, unfollowUser, isFollowing, getFollowCounts
  search.ts             searchUsers, searchByLocation
  social.ts             toggleLike, addComment (triggers notifications)
  storage.ts            uploadOutfitImage, uploadAvatarImage
  ai.ts                 analyzeOutfitImage (Claude API vision)
  uploadStore.ts        Ephemeral image data store during upload flow
  notifications.ts      Push notification stubs

hooks/                  State management (call services, expose to components)
  useAuth.ts            { userId, loading } — listens to auth state changes
  useCloset.ts          { items, hasMore, loadMore, refetch } — paginated (50/page)
  useFeed.ts            { outfits, deleteOutfit, hasMore, loadMore, refetch } — paginated (20/page), modes: 'forYou' | 'following'
  useFollow.ts          { following, counts, loading, toggle } — follow state + optimistic UI

types/                  TypeScript interfaces
  user.ts               UserProfile
  outfit.ts             OutfitPost, OutfitItem, OutfitPostWithItems
  closet.ts             ClosetItem
  comment.ts            Comment

utils/
  constants.ts          CLOTHING_CATEGORIES (source of truth for clothing types)
  theme.ts              Design tokens: colors, spacing, typography
  format.ts             Formatting utilities

supabase/               Database schema and migrations
  schema.sql            Initial schema
  follows_migration.sql Follows table + user profile extensions
  migrations/004_backend_polish.sql  Likes, comments, push tokens, soft deletes, indexes
```

### Data Flow

1. **Services** (`services/*.ts`): Stateless API adapters — no React state, no hooks
2. **Hooks** (`hooks/*.ts`): Manage component state, call services, handle pagination
3. **Components**: Consume hooks, render UI — do not call services directly

### Database Schema

| Table | Key Fields |
|-------|-----------|
| `users` | id, username, avatar_url, bio, location, created_at |
| `outfit_posts` | id, user_id, image_url, caption, created_at, deleted_at (soft delete) |
| `closet_items` | id, user_id, name, category, color, image_url, created_at, deleted_at (soft delete) |
| `outfit_items` | id, outfit_post_id, closet_item_id |
| `follows` | follower_id, following_id, created_at (composite PK, self-follow prevented) |
| `post_likes` | id, post_id, user_id, created_at (UNIQUE per user+post) |
| `post_comments` | id, post_id, user_id, body (max 500 chars), created_at |
| `push_tokens` | id, user_id, token, platform, created_at |

**Storage Buckets:** `outfit-images` (public), `avatars`

Soft deletes use `deleted_at` nullable timestamp + Supabase RPC functions (`soft_delete_closet_item`, etc.). Row-level security isolates user data throughout.

### Claude Vision Integration

`services/ai.ts` exports `analyzeOutfitImage(base64Image, mediaType)`:
- Input: base64-encoded image (JPEG, PNG, or WebP) + media type string
- Model: `claude-opus-4-7` with 30s timeout
- Returns `{ items: DetectedItem[] }` where each item has `name`, `category` (from `CLOTHING_CATEGORIES`), `color`
- Unmapped categories fall back to `'other'`

The system prompt (defined in `services/ai.ts`) controls what Claude extracts. Update it there if you need to change detected attributes.

**Claude AI Behavior Rules:**
- Only identify visible clothing and accessories
- Make a best guess when uncertain but stay conservative
- Do not infer brand unless clearly visible on the item
- Do not invent hidden clothing items
- Always let the user edit detected items before saving

### User Flow

```
index → [unauthenticated] → /auth/login or /auth/signup
      → [authenticated]   → /(tabs)/feed

Feed: "For You" (all posts) | "Following" (followed users only)
  → Like/comment on posts
  → Tap username → /profile/[userId] → follow/unfollow, view their posts/wardrobe

Camera tab:
  → Camera viewfinder (flip, zoom 0.5x/1x/2x)
  → Snap or pick from library
  → Claude analyzes image → detected items list
  → User edits/toggles items
  → Save to closet + optionally post to feed with caption
  → /outfit/success → back to feed

Closet tab:
  → Posts tab (own outfit posts) | Wardrobe tab (closet items, filter by category)
  → Edit avatar → upload new photo
  → Settings button → /settings (edit profile)

Search tab:
  → No query: Explore grid of latest posts → tap → /profile/[userId]
  → With query: Username search results → tap → /profile/[userId]
```

## Key Implementation Notes

**Clothing Categories:** `CLOTHING_CATEGORIES` in `utils/constants.ts` is the source of truth. Keep `ClothingCategory` type and the array in sync when adding categories. Valid values: `top | bottom | outerwear | footwear | accessory | dress | other`.

**Image Format for Claude:** Requires base64 encoding with explicit media type for the Anthropic SDK. `uploadStore.ts` temporarily holds image data between the camera screen and the review/save flow.

**Soft Deletes:** `outfit_posts` and `closet_items` use `deleted_at` for soft deletion via Supabase RPC. Always use the service layer functions — never delete rows directly.

**Notifications:** `social.ts` wraps `likes.ts`/`comments.ts` and triggers push notifications (via Supabase Edge Functions) when users like or comment. `notifications.ts` contains stub handlers.

**Optimistic UI:** `useFollow` updates follow state immediately before the server confirms, and rolls back on error. Apply the same pattern for any new social interactions.

**Adding a Feature:**
1. Create service in `services/` (stateless API logic, Supabase calls)
2. Create hook in `hooks/` (state management, calls service, handles loading/error)
3. Consume hook in component — never call services from components directly

**Scope:** Do not add features outside the current MVP shape. Do not add unnecessary libraries.
