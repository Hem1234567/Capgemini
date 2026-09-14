-- ============================================================================
-- The Cognitive Games — Supabase schema
-- ============================================================================
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
--
-- This creates the two tables the app needs to store each player's game
-- attempts and per-game progress in the cloud, tied to their account, with
-- Row Level Security so a user can only ever see/edit their own rows.
-- ============================================================================

-- ── game_attempts ────────────────────────────────────────────────────────
-- One row per completed practice session.
create table if not exists public.game_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  game_id         text not null,
  game_name       text not null,
  difficulty      text not null,
  mode            text not null,
  score           integer not null,
  accuracy        integer not null,
  time_taken      integer not null,
  correct         integer not null,
  incorrect       integer not null,
  total           integer not null,
  efficiency      integer,
  client_id       text,                       -- id generated on the client, used to avoid duplicate inserts
  created_at      timestamptz not null default now()
);

create index if not exists game_attempts_user_id_idx on public.game_attempts (user_id, created_at desc);
create unique index if not exists game_attempts_client_id_idx on public.game_attempts (user_id, client_id);

alter table public.game_attempts enable row level security;

drop policy if exists "Users can view their own attempts" on public.game_attempts;
create policy "Users can view their own attempts"
  on public.game_attempts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own attempts" on public.game_attempts;
create policy "Users can insert their own attempts"
  on public.game_attempts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own attempts" on public.game_attempts;
create policy "Users can delete their own attempts"
  on public.game_attempts for delete
  using (auth.uid() = user_id);

-- ── game_progress ────────────────────────────────────────────────────────
-- One row per (user, game) pair — a rolled-up summary used for the
-- Progress page and to remember which difficulty a user is currently on.
create table if not exists public.game_progress (
  user_id             uuid not null references auth.users (id) on delete cascade,
  game_id             text not null,
  attempts            integer not null default 0,
  best_score          integer not null default 0,
  avg_score           integer not null default 0,
  avg_accuracy        integer not null default 0,
  avg_time            integer not null default 0,
  current_difficulty  text not null default 'easy',
  highest_difficulty  text not null default 'easy',
  last_attempt        timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.game_progress enable row level security;

drop policy if exists "Users can view their own progress" on public.game_progress;
create policy "Users can view their own progress"
  on public.game_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert their own progress" on public.game_progress;
create policy "Users can upsert their own progress"
  on public.game_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own progress" on public.game_progress;
create policy "Users can update their own progress"
  on public.game_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own progress" on public.game_progress;
create policy "Users can delete their own progress"
  on public.game_progress for delete
  using (auth.uid() = user_id);

-- Basic data-integrity constraints (defense in depth — never rely on the
-- client to send well-formed data; enforce it here too). Postgres has no
-- "ADD CONSTRAINT IF NOT EXISTS", so drop-then-add to stay idempotent.
alter table public.game_attempts drop constraint if exists game_attempts_accuracy_range;
alter table public.game_attempts add constraint game_attempts_accuracy_range check (accuracy between 0 and 100);
alter table public.game_attempts drop constraint if exists game_attempts_score_nonneg;
alter table public.game_attempts add constraint game_attempts_score_nonneg check (score >= 0);
alter table public.game_attempts drop constraint if exists game_attempts_time_nonneg;
alter table public.game_attempts add constraint game_attempts_time_nonneg check (time_taken >= 0);
alter table public.game_attempts drop constraint if exists game_attempts_counts_consistent;
alter table public.game_attempts add constraint game_attempts_counts_consistent check (correct + incorrect <= total);

-- ============================================================================
-- ── profiles ────────────────────────────────────────────────────────────
-- One row per auth user. Holds the role (user/admin) and account status.
-- This is the ONLY place "who is an admin" is recorded — it lives in the
-- database, not in the frontend bundle, so it cannot be edited from
-- devtools/localStorage/the JS console.
-- ============================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  display_name  text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  status        text not null default 'active' check (status in ('active', 'suspended')),
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Security-definer helper: safe to call from any RLS policy without
-- recursive-RLS problems, and it's the single source of truth for "is this
-- request coming from an admin?". Runs with the privileges of the function
-- owner, bypassing RLS on `profiles` itself just for this lookup.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Every user can read/update their own profile row; admins can read every
-- profile (needed for the admin dashboard) but role/status changes for
-- OTHER users are only ever made through the admin-api Edge Function using
-- the service-role key — never directly from the browser — see below.
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update their own display name" on public.profiles;
create policy "Users can update their own display name"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles where id = auth.uid()));

-- Auto-create a profile row the moment someone signs up, so every user
-- always has exactly one profile with no client-side action required.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep last_seen_at fresh. Call this (via the anon client, RLS-checked) once
-- per session/visit — cheap, and gives the admin dashboard a real "active
-- users" signal instead of guessing from game_attempts alone.
create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

revoke all on function public.touch_last_seen() from public;
grant execute on function public.touch_last_seen() to authenticated;

-- ============================================================================
-- ── Admin read access to gameplay data ───────────────────────────────────
-- Regular users still only ever see their own rows (unchanged policies
-- above). These ADD admin-only read access on top, so the dashboard/activity
-- feed can show everyone's data without weakening per-user isolation.
-- ============================================================================
drop policy if exists "Admins can view all attempts" on public.game_attempts;
create policy "Admins can view all attempts"
  on public.game_attempts for select
  using (public.is_admin());

drop policy if exists "Admins can view all progress" on public.game_progress;
create policy "Admins can view all progress"
  on public.game_progress for select
  using (public.is_admin());

-- ============================================================================
-- ── admin_audit_log ───────────────────────────────────────────────────────
-- Every privileged action (role change, suspend, delete) taken through the
-- admin-api Edge Function is written here — who did what, to whom, when.
-- Only admins can read it; only the service role (Edge Function) can write.
-- ============================================================================
create table if not exists public.admin_audit_log (
  id           bigint generated always as identity primary key,
  actor_id     uuid references auth.users (id) on delete set null,
  actor_email  text,
  action       text not null,
  target_id    uuid,
  target_email text,
  detail       jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

alter table public.admin_audit_log enable row level security;

drop policy if exists "Admins can view audit log" on public.admin_audit_log;
create policy "Admins can view audit log"
  on public.admin_audit_log for select
  using (public.is_admin());

-- Helpful indexes for the admin dashboard's aggregate queries.
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists profiles_last_seen_at_idx on public.profiles (last_seen_at desc);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists game_attempts_created_at_idx on public.game_attempts (created_at desc);

-- ============================================================================
-- ── Making the FIRST admin ───────────────────────────────────────────────
-- There is deliberately no "make me admin" button anywhere in the app (that
-- would be a privilege-escalation hole). Promote your own account once, by
-- hand, in the SQL Editor, after you've signed up normally in the app:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- Every admin after that can be promoted from the Admin → Users screen.
-- ============================================================================

-- ============================================================================
-- ── Extended profile fields ───────────────────────────────────────────────
-- Student/user details editable from the Account page, plus a profile
-- picture stored in Supabase Storage (see the `avatars` bucket below).
-- ============================================================================
alter table public.profiles add column if not exists full_name    text;
alter table public.profiles add column if not exists roll_no      text;
alter table public.profiles add column if not exists register_no  text;
alter table public.profiles add column if not exists department   text;
alter table public.profiles add column if not exists phone        text;
alter table public.profiles add column if not exists avatar_url   text;

-- Defense-in-depth length/format limits — enforced here so they hold even
-- if a request is crafted by hand and never touches the frontend form.
alter table public.profiles drop constraint if exists profiles_full_name_len;
alter table public.profiles add constraint profiles_full_name_len check (char_length(coalesce(full_name, '')) <= 120);
alter table public.profiles drop constraint if exists profiles_roll_no_len;
alter table public.profiles add constraint profiles_roll_no_len check (char_length(coalesce(roll_no, '')) <= 40);
alter table public.profiles drop constraint if exists profiles_register_no_len;
alter table public.profiles add constraint profiles_register_no_len check (char_length(coalesce(register_no, '')) <= 40);
alter table public.profiles drop constraint if exists profiles_department_len;
alter table public.profiles add constraint profiles_department_len check (char_length(coalesce(department, '')) <= 120);
alter table public.profiles drop constraint if exists profiles_phone_format;
alter table public.profiles add constraint profiles_phone_format check (phone is null or phone ~ '^[0-9+()\-\s]{0,20}$');

-- Keep profiles.email in sync if a user ever changes their login email
-- through Supabase Auth (auth.updateUser({ email })), so the admin panel
-- and the account page always show the current, verified address.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ── Lock down privileged columns at the table level ──────────────────────
-- Belt-and-braces on top of the RLS policies above: no matter how an update
-- request is shaped (RLS policy quirks, future policy edits, a bug, a
-- hand-crafted request), a user can NEVER change their own role or status —
-- only the admin-api Edge Function can, because it uses the service-role
-- key, which this trigger explicitly recognises and lets through.
create or replace function public.protect_privileged_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    new.role := old.role;
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_privileged_profile_fields_trg on public.profiles;
create trigger protect_privileged_profile_fields_trg
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_fields();

-- Now that the trigger guarantees role/status can't be self-escalated, the
-- update policy just needs to scope rows to their owner — replaces the
-- earlier, narrower policy of the same name.
drop policy if exists "Users can update their own display name" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- ── avatars storage bucket ────────────────────────────────────────────────
-- Profile pictures. Public read (so <img> tags can just use the URL),
-- but a user may only ever write inside a folder named after their own
-- user id — enforced by RLS on storage.objects, not by the app's upload
-- code, so it holds even if that code is bypassed entirely.
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- Done. After running this:
--   1. Go to Project Settings → API and copy the "Project URL" and "anon
--      public" key into your .env file (see .env.example in the project root).
--   2. (Optional but recommended) Go to Authentication → Providers → Email
--      and turn OFF "Confirm email" if you want sign-up to work instantly
--      without needing to click a confirmation link — handy for testing.
--   3. Deploy the `admin-api` Edge Function (see supabase/functions/admin-api)
--      and promote your first admin using the SQL command above.
-- ============================================================================
