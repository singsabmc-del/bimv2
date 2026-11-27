-- BIM Rangsei School — Supabase schema
-- Run this once in the NEW project: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run again (everything is IF NOT EXISTS / OR REPLACE).
--
-- How the app stores data:
--   * bim_school_state   one row, id = 'latest', holding the whole school state as JSONB
--                        (classes, students, payments, attendance, teachers, settings, …).
--                        The server merges each save item-by-item using the `_sync` timestamps
--                        inside `data`, so several devices can save at the same time.
--   * bim_school_backups one row per backup snapshot (Settings → Backup & Restore).
-- Only the server (service_role key or direct Postgres URL) may read/write:
-- RLS is on with NO policies, and the anon / authenticated roles get no grants.

-- ── Main state ──────────────────────────────────────────────────────────────
create table if not exists public.bim_school_state (
  id          text        primary key,                -- always 'latest'
  data        jsonb       not null,
  updated_at  timestamptz not null default now()
);

comment on table  public.bim_school_state is 'BIM school app: full shared state (single row id=latest)';
comment on column public.bim_school_state.data is 'Whole app state; includes lastSavedAt and _sync merge metadata';

-- ── Backups ─────────────────────────────────────────────────────────────────
create table if not exists public.bim_school_backups (
  id          text        primary key,                -- snapshot file name
  title       text,
  created_at  timestamptz not null default now(),
  meta        jsonb,
  data        jsonb
);

create index if not exists bim_school_backups_created_at_idx
  on public.bim_school_backups (created_at desc);

comment on table public.bim_school_backups is 'BIM school app: backup snapshots';

-- ── Keep updated_at current even if a writer forgets it ─────────────────────
create or replace function public.bim_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bim_school_state_touch on public.bim_school_state;
create trigger bim_school_state_touch
  before update on public.bim_school_state
  for each row execute function public.bim_touch_updated_at();

-- ── Security: server-only access ────────────────────────────────────────────
alter table public.bim_school_state   enable row level security;
alter table public.bim_school_backups enable row level security;

revoke all on public.bim_school_state   from anon, authenticated;
revoke all on public.bim_school_backups from anon, authenticated;
grant  all on public.bim_school_state   to service_role;
grant  all on public.bim_school_backups to service_role;

-- ── Empty starting row (the first save from the app fills it) ───────────────
insert into public.bim_school_state (id, data)
values ('latest', '{}'::jsonb)
on conflict (id) do nothing;
