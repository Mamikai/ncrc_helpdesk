-- ============================================
-- NCRC HELP DESK - REQUIRED SEED DATA
-- Run this ALWAYS, in every environment (dev, staging, production).
-- Never delete these rows via teardown-demo.sql.
-- ============================================
USE ncrc_helpdesk;

-- ------------------------------------------------------------
-- BOOTSTRAP ADMIN — REQUIRED
-- Since there is no self-registration, this is the only way
-- anyone can log in and create further users.
--
-- Default password: FightCrime01 (per team decision — same for
-- every new account). This bootstrap admin MUST change it on
-- first login (must_reset_password = 1 enforces this), and you
-- should change it again immediately after go-live regardless.
--
-- The hash below is a bcrypt hash of "FightCrime01" ($2y$ format —
-- PHP's password_hash() output). If login ever fails on this
-- password after a fresh import, regenerate it with:
--   php -r "echo password_hash('FightCrime01', PASSWORD_DEFAULT);"
-- and paste the output in place of the hash below before importing.
-- ------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role, department_id, can_prioritize, must_reset_password, is_active)
SELECT
    'System Administrator',
    'admin@crimeresearch.go.ke',
    '$2y$10$r2TG2DgPK2SmZ0ZO6n3X7eHdHmo/PbI0cSZq2jqOAOPVMKDc.Y1oa',
    'admin',
    (SELECT department_id FROM departments WHERE name = 'ICT'),
    1,
    1,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@crimeresearch.go.ke'
);

-- ------------------------------------------------------------
-- SLA RULES — required for the SLA-compliance stat to compute
-- ------------------------------------------------------------
INSERT INTO sla_rules (priority, response_hours, resolution_hours)
SELECT 'high', 1, 4
WHERE NOT EXISTS (SELECT 1 FROM sla_rules WHERE priority = 'high');

INSERT INTO sla_rules (priority, response_hours, resolution_hours)
SELECT 'medium', 4, 24
WHERE NOT EXISTS (SELECT 1 FROM sla_rules WHERE priority = 'medium');

INSERT INTO sla_rules (priority, response_hours, resolution_hours)
SELECT 'low', 24, 72
WHERE NOT EXISTS (SELECT 1 FROM sla_rules WHERE priority = 'low');
