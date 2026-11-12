-- ---------------------------------------------------------------------------
-- Schedule email
-- When each accepted applicant was sent the schedule (by the dashboard's
-- "Send schedule" button, or attached to their acceptance email), so nobody
-- gets it twice and a send interrupted by Resend's daily limit can resume.
-- ---------------------------------------------------------------------------

alter table applications add column schedule_sent_at timestamptz;
