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
INSERT INTO users (full_name, email, password_hash, role, department, must_reset_password, is_active) VALUES
('Test ICT Officer', 'ict.demo@demo.local', '$2b$10$6QzOGLvcQUulrBxw225Go.ZtUGBg.E4J8oVWpcw2TZ.lDhMhvpTQS', 'ict', 'ICT', 1, 1),
('Test Employee', 'user.demo@demo.local', '$2b$10$6QzOGLvcQUulrBxw225Go.ZtUGBg.E4J8oVWpcw2TZ.lDhMhvpTQS', 'user', 'Research', 1, 1);

-- ---- Demo assets ----
INSERT INTO assets (asset_tag, category, department, assigned_to_name, model, serial_number, status) VALUES
('DEMO-AST-001', 'laptop', 'Research', 'Test Employee', 'Dell Latitude 5420', 'SN-DEMO-001', 'working'),
('DEMO-AST-002', 'laptop', 'ICT', NULL, 'HP EliteBook 840', 'SN-DEMO-002', 'in_store'),
('DEMO-AST-003', 'printer', 'Finance', NULL, 'HP LaserJet Pro M428', 'SN-DEMO-003', 'requires_servicing');

-- ---- Demo tickets ----
INSERT INTO tickets (ticket_number, submitted_by, assigned_to, department, title, description, priority, status, created_at) VALUES
('NCRC-DEMO-001',
    (SELECT user_id FROM users WHERE email = 'user.demo@demo.local'),
    (SELECT user_id FROM users WHERE email = 'ict.demo@demo.local'),
    'Research', '[DEMO] Printer not connecting',
    'Printer on 2nd floor not responding since this morning.', 'medium', 'inprogress',
    '2026-07-20 09:30:00'),

('NCRC-DEMO-002',
    (SELECT user_id FROM users WHERE email = 'user.demo@demo.local'),
    NULL,
    'Research', '[DEMO] VPN connection issue',
    'Cannot connect to VPN from home network.', 'high', 'open',
    '2026-07-21 14:20:00');

-- ---- Demo announcement ----
INSERT INTO announcements (title, body, posted_by) VALUES
('[DEMO] Welcome to the NCRC Help Desk',
 'This is a sample announcement. Admins can post real ones from the Announcements page.',
 (SELECT user_id FROM users WHERE email = 'admin@crimeresearch.go.ke'));
