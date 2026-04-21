-- ============================================================
-- 005_video_support.sql
-- Add video_url and media_type to outfit_posts
-- ============================================================

alter table public.outfit_posts
  add column if not exists media_type text not null default 'image',
  add column if not exists video_url  text;

create index if not exists idx_outfit_posts_media_type
  on public.outfit_posts(media_type);
