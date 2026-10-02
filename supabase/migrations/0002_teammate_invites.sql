-- ---------------------------------------------------------------------------
-- Teammate invites
-- When someone applies with a team, each listed teammate who hasn't applied
-- gets one invite email with a link that pre-fills the form. An address is
-- only ever invited once, whoever lists it; this table is the record of that.
-- ---------------------------------------------------------------------------

create table teammate_invites (
  -- The secret in the invite link. Unguessable, so only the invitee has it.
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  -- Lower-cased invitee address. Unique: one invite per address, ever.
  email       text not null unique,
  -- Who listed them. Kept null (not deleted) if that application is removed,
  -- so the address still can't be invited again.
  invited_by  uuid references applications (id) on delete set null
);

alter table teammate_invites enable row level security;
