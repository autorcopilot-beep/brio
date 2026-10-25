-- Applied to brioinfra on 2026-10-25.
-- Enriches the existing food_items table without replacing user-owned foods.
alter table public.food_items
  add column if not exists brand text,
  add column if not exists category text,
  add column if not exists subcategory text,
  add column if not exists source_url text,
  add column if not exists image_url text,
  add column if not exists package_description text,
  add column if not exists ingredients text,
  add column if not exists allergen_statement text,
  add column if not exists nutrition_serving_label text,
  add column if not exists nutrition_raw jsonb not null default '{}'::jsonb,
  add column if not exists product_details jsonb not null default '{}'::jsonb,
  add column if not exists data_quality_status text not null default 'partial'
    check (data_quality_status in ('complete', 'partial', 'needs_review')),
  add column if not exists updated_at timestamptz not null default now();

alter table public.food_items drop constraint if exists food_items_name_check;
alter table public.food_items add constraint food_items_name_check
  check (char_length(name) between 2 and 240);

create table if not exists public.food_price_observations (
  id uuid primary key default gen_random_uuid(),
  food_item_id uuid not null references public.food_items(id) on delete cascade,
  source text not null,
  store_label text,
  location_label text,
  price_brl numeric(12,2),
  unit_price_per_100g numeric(12,4),
  currency text not null default 'BRL' check (currency = 'BRL'),
  promotion_text text,
  availability text,
  observed_at timestamptz not null,
  source_url text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (food_item_id, source, observed_at)
);

alter table public.food_price_observations enable row level security;
grant select on public.food_price_observations to authenticated;

create policy "Authenticated read visible food prices"
on public.food_price_observations
for select to authenticated
using (
  exists (
    select 1 from public.food_items food
    where food.id = food_item_id
      and (food.user_id is null or food.user_id = (select auth.uid()))
  )
);

create index if not exists food_price_observations_food_date_idx
  on public.food_price_observations (food_item_id, observed_at desc);
create index if not exists food_items_catalog_filters_idx
  on public.food_items (category, subcategory, brand)
  where user_id is null;
