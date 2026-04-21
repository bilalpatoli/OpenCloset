-- ============================================================
-- 004_backend_polish.sql
-- Push notifications, edit profile, social tables, soft deletes, indexes
-- ============================================================

-- ============================================================
-- PUSH TOKENS
-- ============================================================

create table if not exists public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token      text not null,
  platform   text not null,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "Users can select own push tokens"
  on public.push_tokens for select using (auth.uid() = user_id);

create policy "Users can insert own push tokens"
  on public.push_tokens for insert with check (auth.uid() = user_id);

create policy "Users can delete own push tokens"
  on public.push_tokens for delete using (auth.uid() = user_id);

-- ============================================================
-- POST LIKES & COMMENTS
-- ============================================================

create table if not exists public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.outfit_posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Post likes are publicly readable"
  on public.post_likes for select using (true);

create policy "Users can insert own likes"
  on public.post_likes for insert with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on public.post_likes for delete using (auth.uid() = user_id);

create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.outfit_posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create policy "Post comments are publicly readable"
  on public.post_comments for select using (true);

create policy "Users can insert own comments"
  on public.post_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.post_comments for delete using (auth.uid() = user_id);

-- ============================================================
-- EDIT PROFILE — extend users table
-- ============================================================

alter table public.users add column if not exists bio        text;
alter table public.users add column if not exists location   text;
alter table public.users add column if not exists updated_at timestamptz default now();

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger users_updated_at
  before update on public.users
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- SOFT DELETES
-- ============================================================

alter table public.outfit_posts add column if not exists deleted_at timestamptz default null;
alter table public.closet_items add column if not exists deleted_at timestamptz default null;

-- Update SELECT policies to exclude soft-deleted rows
drop policy if exists "Outfit posts are publicly readable" on public.outfit_posts;
create policy "Outfit posts are publicly readable"
  on public.outfit_posts for select using (deleted_at is null);

drop policy if exists "Closet items are publicly readable" on public.closet_items;
create policy "Closet items are publicly readable"
  on public.closet_items for select using (deleted_at is null);

-- Soft-delete update policies (users set deleted_at on their own rows)
create policy "Users can soft delete own outfit posts"
  on public.outfit_posts for update using (auth.uid() = user_id);

create policy "Users can soft delete own closet items"
  on public.closet_items for update using (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_closet_items_user_id
  on public.closet_items(user_id);

create index if not exists idx_closet_items_created_at
  on public.closet_items(created_at desc);

create index if not exists idx_outfit_posts_user_id
  on public.outfit_posts(user_id);

create index if not exists idx_outfit_posts_created_at
  on public.outfit_posts(created_at desc);

create index if not exists idx_outfit_items_outfit_post_id
  on public.outfit_items(outfit_post_id);

create index if not exists idx_outfit_items_closet_item_id
  on public.outfit_items(closet_item_id);

create index if not exists idx_post_likes_post_id
  on public.post_likes(post_id);

create index if not exists idx_post_comments_post_id
  on public.post_comments(post_id);

create index if not exists idx_push_tokens_user_id
  on public.push_tokens(user_id);
