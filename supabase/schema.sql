-- Source of truth applied to brioinfra.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  birth_date date,
  objectives text[] not null default '{}',
  avatar_path text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  visibility text not null default 'locked' check (visibility in ('available','locked','hidden')),
  updated_at timestamptz not null default now()
);
alter table public.feature_flags enable row level security;
create policy "Authenticated users can read feature flags" on public.feature_flags for select to authenticated using (true);
create policy "Admins can insert feature flags" on public.feature_flags for insert to authenticated with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "Admins can update feature flags" on public.feature_flags for update to authenticated using (((select auth.jwt())->'app_metadata'->>'role') = 'admin') with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy "Admins can delete feature flags" on public.feature_flags for delete to authenticated using (((select auth.jwt())->'app_metadata'->>'role') = 'admin');

-- Bucket `avatars` is private. Object policies restrict every operation to `{auth.uid()}/...`.
