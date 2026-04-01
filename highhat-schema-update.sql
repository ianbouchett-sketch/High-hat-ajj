-- =============================================
-- HIGHHAT BJJ -- ADD TO EXISTING SCHEMA
-- Run this in Supabase SQL Editor
-- It adds products table and auth trigger
-- =============================================

-- Auto-create member row when someone signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.members (id, email, name, status, belt, stripes, joined_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    'inactive', -- starts inactive until payment is set up
    'White',
    0,
    current_date
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Fire the function whenever a new auth user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---- PRODUCTS ----
-- Simple retail items the admin can charge members for
create table if not exists products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  price_cents int not null, -- stored in cents, e.g. 3500 = $35.00
  inventory   int default null, -- null means unlimited
  active      boolean default true,
  image_url   text,
  created_at  timestamptz default now()
);

-- Anyone authenticated can read products
alter table products enable row level security;
create policy "Authenticated users can read products"
  on products for select
  using (auth.role() = 'authenticated');

-- Add phone and emergency contact to members if not already there
alter table members add column if not exists phone text;
alter table members add column if not exists emergency_contact text;
alter table members add column if not exists avatar_color text default '#3e1460';
alter table members add column if not exists stripe_subscription_id text;
alter table members add column if not exists last_payment text;

-- Allow members to update their own phone/address/emergency fields
drop policy if exists "Members can update own profile fields" on members;
create policy "Members can update own profile fields"
  on members for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins (service role) can read all members -- handled by service role key bypassing RLS
-- Make sure RLS is disabled for admin queries (service role bypasses anyway)
