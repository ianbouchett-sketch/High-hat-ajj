-- =============================================
-- HIGHHAT AMERICAN JIU JITSU - SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- =============================================


-- ---- MEMBERS ----
-- One row per member. Links to Supabase auth.users via id.
-- Also stores the Stripe customer ID so webhooks can find the right member.

create table members (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  name            text not null,
  phone           text,
  address         text,
  emergency_contact text,
  avatar_color    text default '#7a3aae',

  -- Belt info (only admins can update these)
  belt            text not null default 'White' check (belt in ('White','Blue','Purple','Brown','Black')),
  stripes         int  not null default 0 check (stripes between 0 and 4),

  -- Membership
  status          text not null default 'active' check (status in ('active','overdue','inactive')),
  joined_at       date not null default current_date,
  next_payment_date date,

  -- Stripe
  stripe_customer_id  text unique,
  stripe_subscription_id text unique,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Members can read and update their own non-belt rows.
-- Admins (service role) can update everything.
alter table members enable row level security;

create policy "Members can read own row"
  on members for select
  using (auth.uid() = id);

create policy "Members can update own profile fields"
  on members for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- belt and stripes are excluded: only the service role (backend) can change them
  );


-- ---- SESSIONS ----
-- One row per training session a member logs.

create table sessions (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  session_date date not null default current_date,
  note        text,
  created_at  timestamptz default now(),

  -- prevent duplicate dates per member
  unique (member_id, session_date)
);

alter table sessions enable row level security;

create policy "Members can read own sessions"
  on sessions for select
  using (auth.uid() = member_id);

create policy "Members can insert own sessions"
  on sessions for insert
  with check (auth.uid() = member_id);

create policy "Members can delete own sessions"
  on sessions for delete
  using (auth.uid() = member_id);


-- ---- CLASS SCHEDULE ----
-- Static schedule managed by admins.

create table schedule (
  id          uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Sun, 6=Sat
  start_time  time not null,
  class_name  text not null,
  instructor  text,
  active      boolean default true
);

alter table schedule enable row level security;

create policy "Anyone authenticated can read schedule"
  on schedule for select
  using (auth.role() = 'authenticated');


-- ---- PAYMENT EVENTS ----
-- Append-only log of Stripe webhook events.
-- Useful for auditing and debugging billing issues.

create table payment_events (
  id              uuid primary key default gen_random_uuid(),
  member_id       uuid references members(id) on delete set null,
  stripe_event_id text not null unique,
  event_type      text not null,  -- e.g. 'invoice.paid', 'invoice.payment_failed'
  amount_cents    int,
  currency        text default 'usd',
  status          text,           -- 'paid', 'failed', 'refunded'
  raw_payload     jsonb,          -- full Stripe event object for debugging
  created_at      timestamptz default now()
);

-- Only the service role (backend) writes to this table.
-- Members can see their own payment history.
alter table payment_events enable row level security;

create policy "Members can read own payment events"
  on payment_events for select
  using (auth.uid() = member_id);


-- ---- HELPER FUNCTION ----
-- Auto-update the updated_at column on members.

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on members
  for each row execute procedure handle_updated_at();


-- ---- SEED: SAMPLE SCHEDULE ----
insert into schedule (day_of_week, start_time, class_name, instructor) values
  (1, '06:00', 'Fundamentals', 'Claudia F.'),
  (1, '18:30', 'Advanced', 'Claudia F.'),
  (2, '18:30', 'No-Gi', 'Noah P.'),
  (3, '06:00', 'Fundamentals', 'Claudia F.'),
  (3, '18:30', 'Advanced', 'Claudia F.'),
  (4, '18:30', 'Open Mat', null),
  (5, '06:00', 'Fundamentals', 'Claudia F.'),
  (6, '10:00', 'Open Mat', null),
  (6, '11:30', 'Competition Class', 'Claudia F.');
