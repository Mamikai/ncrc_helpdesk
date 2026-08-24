-- ============================================
-- NCRC HELP DESK - DEMO / TEST SEED DATA
-- Safe to load for local development and team testing.
-- MUST be removed before the site goes live — run
-- teardown-demo.sql before your official launch.
--
-- Every row here is deliberately marked so the teardown
-- script can find it safely:
--   - demo user emails end in @demo.local
--   - demo ticket titles start with [DEMO]
--   - demo asset tags start with DEMO-
-- Never reuse these markers for real data.
-- ============================================
USE ncrc_helpdesk;

-- ---- Demo users (all three roles, all password: FightCrime01) ----
-- The 'ict.demo' account also gets can_prioritize = 1 so you can see
-- the auto-high-priority behavior when it submits a ticket.
INSERT INTO users (full_name, email, password_hash, role, department_id, can_prioritize, must_reset_password, is_active) VALUES
('Test ICT Officer', 'ict.demo@demo.local', '$2b$10$6QzOGLvcQUulrBxw225Go.ZtUGBg.E4J8oVWpcw2TZ.lDhMhvpTQS', 'ict', (SELECT department_id FROM departments WHERE name = 'ICT'), 0, 1, 1),
('Test Employee', 'user.demo@demo.local', '$2b$10$6QzOGLvcQUulrBxw225Go.ZtUGBg.E4J8oVWpcw2TZ.lDhMhvpTQS', 'user', (SELECT department_id FROM departments WHERE name = 'Crime Research Directorate'), 0, 1, 1),
('Test Audit Officer', 'audit.demo@demo.local', '$2b$10$6QzOGLvcQUulrBxw225Go.ZtUGBg.E4J8oVWpcw2TZ.lDhMhvpTQS', 'user', (SELECT department_id FROM departments WHERE name = 'Internal Audit and Risk Assurance'), 1, 1, 1);

-- ---- Demo assets ----
INSERT INTO assets (asset_tag, category, department_id, assigned_to_name, model, serial_number, status) VALUES
('DEMO-AST-001', 'laptop', (SELECT department_id FROM departments WHERE name = 'Crime Research Directorate'), 'Test Employee', 'Dell Latitude 5420', 'SN-DEMO-001', 'working'),
('DEMO-AST-002', 'laptop', (SELECT department_id FROM departments WHERE name = 'ICT'), NULL, 'HP EliteBook 840', 'SN-DEMO-002', 'in_store'),
('DEMO-AST-003', 'printer', (SELECT department_id FROM departments WHERE name = 'Finance and Accounts'), NULL, 'HP LaserJet Pro M428', 'SN-DEMO-003', 'requires_servicing');

-- ---- Demo tickets ----
-- NCRC-DEMO-002 is submitted by the audit demo account (can_prioritize = 1),
-- so it's auto-High even though nobody picked a priority for it.
INSERT INTO tickets (ticket_number, submitted_by, assigned_to, department_id, title, description, priority, status, created_at) VALUES
('NCRC-DEMO-001',
    (SELECT user_id FROM users WHERE email = 'user.demo@demo.local'),
    (SELECT user_id FROM users WHERE email = 'ict.demo@demo.local'),
    (SELECT department_id FROM departments WHERE name = 'Crime Research Directorate'),
    '[DEMO] Printer not connecting',
    'Printer on 2nd floor not responding since this morning.', 'medium', 'inprogress',
    '2026-07-20 09:30:00'),

('NCRC-DEMO-002',
    (SELECT user_id FROM users WHERE email = 'audit.demo@demo.local'),
    NULL,
    (SELECT department_id FROM departments WHERE name = 'Internal Audit and Risk Assurance'),
    '[DEMO] VPN connection issue',
    'Cannot connect to VPN from home network.', 'high', 'open',
    '2026-07-21 14:20:00');

-- ---- Demo announcement ----
INSERT INTO announcements (title, body, posted_by) VALUES
('[DEMO] Welcome to the NCRC Help Desk',
 'This is a sample announcement. Admins can post real ones from the Announcements page.',
 (SELECT user_id FROM users WHERE email = 'admin@crimeresearch.go.ke'));
