-- HackPerimeter schema. Run once in the Supabase SQL editor (or `supabase db push`).
--
-- Every table has row-level security switched on with no policies, so the
-- public anon key can read or write nothing. All access goes through the
-- Next.js server using the service-role key, after it has checked the caller.

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------

create type application_status as enum ('pending', 'accepted', 'waitlisted', 'rejected');

create table applications (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  full_name        text not null,
  email            text not null,
  school           text not null,
  graduation_year  text not null,
  major            text not null,
  experience       text not null,
  interests        text[] not null,
  portfolio_url    text,
  team_mode        text not null check (team_mode in ('solo', 'team')),
  team_name        text,
  teammates        jsonb not null default '[]'::jsonb,
  needs            text,

  -- Path inside the private "resumes" bucket, or null when none was uploaded.
  resume_path      text,

  status           application_status not null default 'pending',
  status_changed_at timestamptz,
  -- Set once the acceptance email has gone out, so it is never sent twice.
  accepted_email_sent_at timestamptz
);

-- One application per person, whatever capitalisation they typed.
create unique index applications_email_unique on applications (lower(email));
create index applications_created_at_idx on applications (created_at desc);
create index applications_status_idx on applications (status);

alter table applications enable row level security;

create function touch_updated_at() returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger applications_touch_updated_at
  before update on applications
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Resume uploads
-- Uploads land here first and are linked to an application on submit. The
-- daily maintenance job deletes uploads that were never linked.
-- ---------------------------------------------------------------------------

create table resume_uploads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  path        text not null unique,
  size_bytes  integer not null,
  claimed_at  timestamptz
);

create index resume_uploads_unclaimed_idx on resume_uploads (created_at) where claimed_at is null;

alter table resume_uploads enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 4194304, array['application/pdf'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window, shared by every serverless instance)
-- ---------------------------------------------------------------------------

create table rate_limits (
  key          text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (key, window_start)
);

alter table rate_limits enable row level security;

-- Records one hit for `p_key` and returns true while the caller is within
-- `p_max` hits for the current window of `p_window_seconds`.
create function rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into rate_limits (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = rate_limits.hits + 1
  returning hits into v_hits;

  return v_hits <= p_max;
end;
$$;

revoke all on function rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function rate_limit_hit(text, integer, integer) to service_role;
