# OpenCloset

AI-powered mobile app that identifies clothing items from outfit photos, saves them to your personal digital closet, and lets you post outfits to a public social feed.

## Tech Stack

- **Expo / React Native** — mobile app
- **Supabase** — auth, database, storage
- **Claude Vision (Anthropic)** — outfit detection

## Setup

```bash
npm install
cp .env.example .env
# Fill in your keys in .env
npm start
```

## Folder Structure

```
app/          Expo Router screens
components/   Reusable UI
services/     API & logic layer (Supabase, Claude)
hooks/        Custom React hooks
utils/        Helpers & constants
types/        TypeScript interfaces
assets/       Images & icons
```
