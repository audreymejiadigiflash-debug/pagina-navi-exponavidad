-- =============================================================================
-- NaviExpoNavidad — database schema
-- Run this once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id text primary key,
  name text not null,
  short_name text not null,
  description text not null default '',
  image_url text,
  sort_order integer not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check (char_length(name) between 2 and 140),
  category_id text not null references public.categories (id) on update cascade,
  description text not null default '',
  price_cents integer not null check (price_cents > 0),
  sale_price_cents integer check (
    sale_price_cents is null or (sale_price_cents > 0 and sale_price_cents < price_cents)
  ),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  badge text check (badge in ('nuevo', 'mas-vendido', 'edicion-limitada')),
  featured boolean not null default false,
  published boolean not null default true,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_published_idx on public.products (published);

-- Sizes of a product (e.g. a tree in 1.90, 2.20 and 2.50 m), each with its own price and stock.
-- Products without rows here are sold as a single item using the price and stock above.
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  price_cents integer not null check (price_cents > 0),
  sale_price_cents integer check (
    sale_price_cents is null or (sale_price_cents > 0 and sale_price_cents < price_cents)
  ),
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  unique (product_id, label)
);

create index if not exists product_variants_product_idx on public.product_variants (product_id);

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1),
  shipping_flat_cents integer not null default 0 check (shipping_flat_cents >= 0),
  free_shipping_threshold_cents integer check (
    free_shipping_threshold_cents is null or free_shipping_threshold_cents > 0
  ),
  promo_text text not null default '',
  business_name text not null default 'NaviExpoNavidad',
  contact_email text not null default '',
  contact_phone text not null default '',
  business_address text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id, shipping_flat_cents)
values (1, 19900)
on conflict (id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'payment_failed')
  ),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_street text not null,
  shipping_exterior_number text not null,
  shipping_interior_number text not null default '',
  shipping_neighborhood text not null,
  shipping_city text not null,
  shipping_state text not null,
  shipping_postal_code text not null,
  shipping_references text not null default '',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents > 0),
  mp_preference_id text,
  mp_payment_id text,
  mp_payment_status text,
  stock_applied boolean not null default false,
  tracking_number text not null default '',
  admin_notes text not null default '',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_slug text not null,
  image_url text,
  unit_price_cents integer not null check (unit_price_cents > 0),
  quantity integer not null check (quantity between 1 and 99),
  line_total_cents integer not null check (line_total_cents > 0)
);

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete set null;
alter table public.order_items
  add column if not exists variant_label text not null default '';

create index if not exists order_items_order_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

drop trigger if exists store_settings_touch on public.store_settings;
create trigger store_settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Payment confirmation: marks the order as paid and discounts stock exactly once,
-- even if Mercado Pago sends the same notification several times.
-- -----------------------------------------------------------------------------
create or replace function public.mark_order_paid(
  p_order_id uuid,
  p_payment_id text,
  p_payment_status text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_applied boolean;
begin
  select stock_applied into v_stock_applied
  from orders
  where id = p_order_id
  for update;

  if not found then
    return false;
  end if;

  if not v_stock_applied then
    update product_variants v
    set stock = greatest(v.stock - oi.quantity, 0)
    from order_items oi
    where oi.order_id = p_order_id and oi.variant_id = v.id;

    update products p
    set stock = greatest(p.stock - oi.quantity, 0)
    from order_items oi
    where oi.order_id = p_order_id and oi.product_id = p.id and oi.variant_id is null;

    update orders set stock_applied = true where id = p_order_id;
  end if;

  update orders
  set
    status = case when status in ('pending_payment', 'payment_failed') then 'paid' else status end,
    mp_payment_id = p_payment_id,
    mp_payment_status = p_payment_status,
    paid_at = coalesce(paid_at, now())
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.mark_order_paid(uuid, text, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text, text) to service_role;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- Visitors can only read the catalog. Orders are only reachable from the server
-- (service role), never from the browser.
-- -----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Catalog categories are public" on public.categories;
create policy "Catalog categories are public" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Published products are public" on public.products;
create policy "Published products are public" on public.products
  for select to anon, authenticated using (published);

drop policy if exists "Variants of published products are public" on public.product_variants;
create policy "Variants of published products are public" on public.product_variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.published)
  );

drop policy if exists "Store settings are public" on public.store_settings;
create policy "Store settings are public" on public.store_settings
  for select to anon, authenticated using (true);

-- -----------------------------------------------------------------------------
-- Storage bucket for product photos (public read; uploads only from the server)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
