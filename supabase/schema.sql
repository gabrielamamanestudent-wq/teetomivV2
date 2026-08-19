-- ============================================================================
-- TEETOMIC — Supabase / Postgres schema
-- ----------------------------------------------------------------------------
-- Run this once in your Supabase project's SQL editor (Dashboard → SQL → New
-- query → paste → Run). It creates every table the app persists, plus the
-- public storage bucket used by the Business Corner image uploader.
--
-- The app reaches these tables through the service-role key on the server only
-- (see SupabaseRepository), so Row Level Security is left enabled with no public
-- policies — nothing is reachable from the browser directly.
-- ============================================================================

-- ---- Courses ---------------------------------------------------------------
create table if not exists courses (
  id              text primary key,
  name            text not null,
  slug            text not null,
  region          text not null,
  city            text not null,
  description_en  text not null default '',
  description_fr  text not null default '',
  photo_url       text not null default '',
  logo_label      text not null default 'GC',
  rack_rate_low   numeric not null default 45,
  rack_rate_high  numeric not null default 95,
  rating          numeric not null default 4.5,
  holes_available integer[] not null default '{9,18}',
  cart_available  boolean not null default true,
  lat             numeric not null default 45.5,
  lng             numeric not null default -73.6,
  approved        boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ---- Slots (tee times) -----------------------------------------------------
create table if not exists slots (
  id            text primary key,
  course_id     text not null references courses(id) on delete cascade,
  tee_time_iso  timestamptz not null,
  holes         integer not null,
  cart          boolean not null default true,
  walking       boolean not null default true,
  players       integer not null default 4,
  spots_left    integer not null default 4,
  rack_rate     numeric not null,
  floor_price   numeric not null,
  current_price numeric not null,
  status        text not null default 'released',
  band          text not null,
  weather       text not null default 'sun',
  fill_rate     numeric not null default 0.5
);
create index if not exists slots_course_idx on slots(course_id);
create index if not exists slots_status_idx on slots(status);

-- ---- Bookings --------------------------------------------------------------
create table if not exists bookings (
  id                              text primary key,
  reference                       text not null,
  slot_id                         text not null,
  course_id                       text not null,
  golfer_id                       text not null,
  golfer_name                     text not null,
  golfer_email                    text not null,
  players                         integer not null,
  price_per_player                numeric not null,
  created_at_iso                  timestamptz not null default now(),
  tee_time_iso                    timestamptz not null,
  status                          text not null default 'confirmed',
  deposit_cents                   integer not null default 0,
  deposit_status                  text not null default 'authorized',
  payment_intent_id               text not null default '',
  free_cancellation_deadline_iso  timestamptz not null
);
create index if not exists bookings_golfer_idx on bookings(golfer_id);
create index if not exists bookings_course_idx on bookings(course_id);
create index if not exists bookings_slot_idx on bookings(slot_id);

-- ---- Loyalty accounts ------------------------------------------------------
create table if not exists golfer_accounts (
  golfer_id        text primary key,
  lifetime_points  integer not null default 0,
  tee_credit_cents integer not null default 0,
  subscription     text not null default 'none',
  handicap         numeric
);

-- ---- Points ledger ---------------------------------------------------------
create table if not exists points_ledger (
  id             text primary key,
  golfer_id      text not null,
  delta          integer not null,
  reason         text not null,
  label_en       text not null default '',
  label_fr       text not null default '',
  booking_id     text,
  created_at_iso timestamptz not null default now()
);
create index if not exists points_golfer_idx on points_ledger(golfer_id);

-- ---- Standby alerts --------------------------------------------------------
create table if not exists alerts (
  id             text primary key,
  golfer_id      text not null,
  label          text not null,
  regions        text[] not null default '{}',
  bands          text[] not null default '{}',
  days           integer[] not null default '{}',
  max_price      numeric not null,
  active         boolean not null default true,
  created_at_iso timestamptz not null default now()
);
create index if not exists alerts_golfer_idx on alerts(golfer_id);

-- ---- Notifications (golfer + operator, keyed by golfer_id / op:<courseId>) --
create table if not exists notifications (
  id             text primary key,
  golfer_id      text not null,
  title_en       text not null default '',
  title_fr       text not null default '',
  body_en        text not null default '',
  body_fr        text not null default '',
  created_at_iso timestamptz not null default now(),
  read           boolean not null default false,
  slot_id        text,
  kind           text not null default 'match'
);
create index if not exists notifications_golfer_idx on notifications(golfer_id);

-- ---- Users (operators + admin) --------------------------------------------
create table if not exists users (
  id        text primary key,
  name      text not null,
  email     text not null,
  password  text not null,
  role      text not null,
  course_id text
);
create index if not exists users_email_idx on users(lower(email));

-- ---- Course availability (operator blackout hours) -------------------------
create table if not exists course_availability (
  course_id   text primary key references courses(id) on delete cascade,
  closed_days integer[] not null default '{}',
  blackout    jsonb not null default '[]'
);

-- ---- Row Level Security ----------------------------------------------------
-- Server uses the service-role key (bypasses RLS). Enabling RLS with no public
-- policy means the anon/browser key cannot read or write these tables.
alter table courses             enable row level security;
alter table slots               enable row level security;
alter table bookings            enable row level security;
alter table golfer_accounts     enable row level security;
alter table points_ledger       enable row level security;
alter table alerts              enable row level security;
alter table notifications       enable row level security;
alter table users               enable row level security;
alter table course_availability enable row level security;

-- ---- Storage bucket for Business Corner course photos ----------------------
-- Public read (course photos show on the site); writes go through the server.
insert into storage.buckets (id, name, public)
values ('course-photos', 'course-photos', true)
on conflict (id) do nothing;
