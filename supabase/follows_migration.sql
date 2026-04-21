-- ============================================================
-- OpenCloset — Follows Migration
-- Run this in the Supabase SQL editor after schema.sql
-- ============================================================

-- Follows relationship
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

-- Add bio, location, updated_at to users if not already present
alter table public.users
  add column if not exists bio        text,
  add column if not exists location   text,
  add column if not exists updated_at timestamptz default now();

-- Create avatars storage bucket (public)
-- Run in dashboard or uncomment:
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
-- on conflict (id) do nothing;

-- Storage policy: anyone can read avatars
-- create policy "Avatars are publicly readable"
--   on storage.objects for select using (bucket_id = 'avatars');
-- create policy "Users can upload their own avatar"
--   on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can update their own avatar"
--   on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
