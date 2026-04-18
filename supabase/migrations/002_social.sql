-- ============================================================
-- Migration 002 — Social (likes + comments)
-- Run this in the Supabase SQL editor after 001 (schema.sql)
-- ============================================================

-- ── Tables ────────────────────────────────────────────────────────────────

create table public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.outfit_posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Prevent a user from liking the same post twice
  unique(post_id, user_id)
);

create table public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.outfit_posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────

alter table public.post_likes    enable row level security;
alter table public.post_comments enable row level security;

-- post_likes: public read, owner insert/delete
create policy "Post likes are publicly readable"
  on public.post_likes for select using (true);

create policy "Users can like posts"
  on public.post_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on public.post_likes for delete using (auth.uid() = user_id);

-- post_comments: public read, owner insert/delete
create policy "Post comments are publicly readable"
  on public.post_comments for select using (true);

create policy "Users can add comments"
  on public.post_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.post_comments for delete using (auth.uid() = user_id);
