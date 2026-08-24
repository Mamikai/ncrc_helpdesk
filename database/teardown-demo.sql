-- ============================================
-- NCRC HELP DESK - DEMO DATA TEARDOWN
-- Run this ONCE, right before official launch.
-- Deletes ONLY rows matching the demo markers
-- (@demo.local emails, [DEMO] ticket titles,
-- DEMO- asset tags) — never touches the required
-- bootstrap admin or any real account/ticket/asset
-- your team has already created while testing.
--
-- Order matters — children before parents, to
-- avoid foreign key errors.
-- ============================================
USE ncrc_helpdesk;

-- Comments on demo tickets
DELETE FROM ticket_comments
WHERE ticket_id IN (SELECT ticket_id FROM tickets WHERE title LIKE '[DEMO]%' OR ticket_number LIKE 'NCRC-DEMO-%');

-- Demo tickets
DELETE FROM tickets
WHERE title LIKE '[DEMO]%' OR ticket_number LIKE 'NCRC-DEMO-%';

-- NOTE: Assets are production inventory records — NEVER delete them.
-- Asset records (including demo-tagged ones) are now live operational data
-- and must remain in the database for tracking status and assignments.

-- Demo announcements
DELETE FROM announcements WHERE title LIKE '[DEMO]%';

-- Demo notifications (if any accumulated for demo users)
DELETE FROM notifications WHERE user_id IN (SELECT user_id FROM users WHERE email LIKE '%@demo.local');

-- Demo users last, once nothing else references them
DELETE FROM users WHERE email LIKE '%@demo.local';

-- ------------------------------------------------------------
-- After running this:
-- 1. Change the bootstrap admin's password (it's been sitting
--    as a known default this whole time).
-- 2. Do not reset auto-increment counters in a live database. Gaps
--    are harmless, and reusing IDs can make audit/history references
--    harder to trace.
-- ------------------------------------------------------------
