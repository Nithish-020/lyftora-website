create extension if not exists citext;
create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null unique,
  source       text,
  ref          text,
  ip_hash      text,
  user_agent   text,
  country      text,
  created_at   timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);

-- Lock the table down. Only the service role (used by the Cloudflare Function) can write.
alter table public.waitlist enable row level security;

revoke all on public.waitlist from anon, authenticated;
-- (service_role bypasses RLS, so no explicit policy is needed for it.)
