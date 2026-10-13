-- ---------------------------------------------------------------------------
-- Weekly reminders
-- One row per reminder sent to accepted applicants. The daily job claims the
-- row for this week before sending, so a retried job never sends twice.
-- ---------------------------------------------------------------------------

create table weekly_reminders (
  -- How many weeks were left when it went out (4, 3, 2, 1).
  weeks_left  integer primary key,
  sent_at     timestamptz not null default now(),
  recipients  integer
);

alter table weekly_reminders enable row level security;
