-- ============================================================
-- OpenCloset — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- Public user profiles (extends auth.users)
create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Clothing items saved to a user's closet
create table public.closet_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  name       text not null,
  category   text not null,
  color      text,
  image_url  text,
  created_at timestamptz not null default now()
);

-- Outfit posts shared to the public feed
create table public.outfit_posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  image_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);

-- Junction table linking outfit posts to their closet items
create table public.outfit_items (
  id              uuid primary key default gen_random_uuid(),
  outfit_post_id  uuid not null references public.outfit_posts(id) on delete cascade,
  closet_item_id  uuid not null references public.closet_items(id) on delete cascade
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users        enable row level security;
alter table public.closet_items enable row level security;
alter table public.outfit_posts enable row level security;
alter table public.outfit_items enable row level security;

-- users: public read, owner write
create policy "Users are publicly readable"
  on public.users for select using (true);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- closet_items: public read, owner write
create policy "Closet items are publicly readable"
  on public.closet_items for select using (true);

create policy "Users can insert own closet items"
  on public.closet_items for insert with check (auth.uid() = user_id);

create policy "Users can update own closet items"
  on public.closet_items for update using (auth.uid() = user_id);

create policy "Users can delete own closet items"
  on public.closet_items for delete using (auth.uid() = user_id);

-- outfit_posts: public read, owner write
create policy "Outfit posts are publicly readable"
  on public.outfit_posts for select using (true);

create policy "Users can insert own outfit posts"
  on public.outfit_posts for insert with check (auth.uid() = user_id);

create policy "Users can update own outfit posts"
  on public.outfit_posts for update using (auth.uid() = user_id);

create policy "Users can delete own outfit posts"
  on public.outfit_posts for delete using (auth.uid() = user_id);

-- outfit_items: public read, owner write (checked via outfit_posts)
create policy "Outfit items are publicly readable"
  on public.outfit_items for select using (true);

create policy "Users can insert outfit items for own posts"
  on public.outfit_items for insert with check (
    exists (
      select 1 from public.outfit_posts
      where id = outfit_post_id and user_id = auth.uid()
    )
  );

create policy "Users can delete outfit items for own posts"
  on public.outfit_items for delete using (
    exists (
      select 1 from public.outfit_posts
      where id = outfit_post_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- Runs as security definer so it bypasses RLS on the users table.
-- The username is passed via signUp options.data.username in the client.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE
-- Run these or create the bucket manually in the Supabase dashboard:
-- Dashboard > Storage > New Bucket > Name: "outfit-images", Public: true
-- ============================================================

-- insert into storage.buckets (id, name, public) values ('outfit-images', 'outfit-images', true);
