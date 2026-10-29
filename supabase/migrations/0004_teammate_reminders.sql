-- ---------------------------------------------------------------------------
-- Teammate reminders
-- Organizers can send one reminder to listed teammates who still haven't
-- applied. This records when, so an address is reminded at most once.
-- ---------------------------------------------------------------------------

alter table teammate_invites add column reminded_at timestamptz;
