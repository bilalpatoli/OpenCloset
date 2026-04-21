-- ============================================================
-- OpenCloset — Follows Migration
-- Run this in the Supabase SQL editor after schema.sql
-- ============================================================

create table if not exists public.follows (
  follower_id  uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "Follows are publicly readable"
  on public.follows for select using (true);

create policy "Users can follow others"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

alter table public.users
  add column if not exists bio        text,
  add column if not exists location   text,
  add column if not exists updated_at timestamptz default now();
